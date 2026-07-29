'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { matchText } from '@/lib/matching/rules'
import { classifyByEmbeddingWithMargin } from '@/lib/matching/embeddings'
import { decryptSecret } from '@/lib/crypto/byok'
import type {
  CaseItem,
  ChaseMessageMethod,
  MatchedBy,
  RequirementPack,
} from '@/lib/types'

interface CaseFileForMatching {
  id: string
  requirement_packs: RequirementPack
  case_items: CaseItem[]
}

export async function classifyPastedText(formData: FormData) {
  const caseFileId = formData.get('case_file_id') as string
  const sourceText = formData.get('source_text') as string

  const supabase = await createClient()

  const { data: caseFile, error: fetchError } = await supabase
    .from('case_files')
    .select('id, requirement_packs ( * ), case_items ( * )')
    .eq('id', caseFileId)
    .single<CaseFileForMatching>()

  if (fetchError || !caseFile) {
    return
  }

  const pendingItems = caseFile.case_items.filter(
    (item) => item.status !== 'received'
  )
  const pendingRequirements = caseFile.requirement_packs.requirements.filter(
    (requirement) =>
      pendingItems.some((item) => item.requirement_key === requirement.key)
  )

  const ruleMatches = matchText(sourceText, pendingRequirements)
  const ruleMatchedKeys = new Set(
    ruleMatches.map((match) => match.requirementKey)
  )

  // Only fall back to embedding similarity for items the zero-cost keyword
  // matcher didn't already catch (PRD §8 priority order: rules first).
  const remainingRequirements = pendingRequirements.filter(
    (requirement) => !ruleMatchedKeys.has(requirement.key)
  )

  let embeddingMatches: { requirementKey: string; confidence: number }[] = []
  if (remainingRequirements.length > 0) {
    try {
      const results = await classifyByEmbeddingWithMargin(
        sourceText,
        remainingRequirements.map((requirement) => ({
          key: requirement.key,
          description: requirement.description,
        }))
      )
      embeddingMatches = results.map((result) => ({
        requirementKey: result.key,
        confidence: result.score,
      }))
    } catch (error) {
      // ML service being down must never break the rules-based core loop.
      console.error('Embedding classification unavailable:', error)
    }
  }

  const matches: {
    requirementKey: string
    confidence: number
    matchedBy: MatchedBy
    matchedKeywords?: string[]
  }[] = [
    ...ruleMatches.map((match) => ({
      requirementKey: match.requirementKey,
      confidence: match.confidence,
      matchedBy: 'rule' as const,
      matchedKeywords: match.matchedKeywords,
    })),
    ...embeddingMatches.map((match) => ({
      requirementKey: match.requirementKey,
      confidence: match.confidence,
      matchedBy: 'embedding' as const,
    })),
  ]

  for (const match of matches) {
    const item = pendingItems.find(
      (candidate) => candidate.requirement_key === match.requirementKey
    )
    if (!item) continue

    await supabase
      .from('case_items')
      .update({
        status: 'received',
        source_text: sourceText,
        matched_confidence: match.confidence,
        matched_by: match.matchedBy,
        received_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    await supabase.from('audit_log').insert({
      case_file_id: caseFileId,
      event_type: 'case_item_matched',
      event_payload: {
        requirement_key: match.requirementKey,
        confidence: match.confidence,
        matched_by: match.matchedBy,
        ...(match.matchedKeywords
          ? { matched_keywords: match.matchedKeywords }
          : {}),
      },
    })
  }

  revalidatePath(`/case-files/${caseFileId}`)
}

export async function setCaseItemStatus(formData: FormData) {
  const caseItemId = formData.get('case_item_id') as string
  const caseFileId = formData.get('case_file_id') as string
  const status = formData.get('status') as 'received' | 'missing'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .from('case_items')
    .update({
      status,
      matched_by: null,
      received_at: status === 'received' ? new Date().toISOString() : null,
      reviewed_by: user?.id ?? null,
    })
    .eq('id', caseItemId)

  await supabase.from('audit_log').insert({
    case_file_id: caseFileId,
    event_type: 'case_item_manually_reviewed',
    event_payload: { case_item_id: caseItemId, status },
    actor: user?.id,
  })

  revalidatePath(`/case-files/${caseFileId}`)
}

export async function sendChaseMessage(formData: FormData) {
  const caseFileId = formData.get('case_file_id') as string
  const body = formData.get('body') as string
  const method = (formData.get('method') as ChaseMessageMethod) || 'template'

  const supabase = await createClient()

  const { error } = await supabase.from('chase_messages').insert({
    case_file_id: caseFileId,
    method,
    body,
    sent_at: new Date().toISOString(),
  })

  if (!error) {
    await supabase.from('audit_log').insert({
      case_file_id: caseFileId,
      event_type: 'chase_message_sent',
      event_payload: { method },
    })
  }

  revalidatePath(`/case-files/${caseFileId}`)
}

// Optional, off-by-default BYOK step (PRD §8.5 / §16 step 8): rewrites the
// already-generated template, it never drafts from scratch. Only reachable
// if the org has AI polish enabled with a stored key — the core chase-
// message loop above never depends on this succeeding or even running.
export async function polishChaseMessage(
  caseFileId: string,
  draftBody: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Not signed in' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { ok: false, error: 'No organization found' }
  }

  const { data: credential } = await supabase
    .from('llm_credentials')
    .select('enabled, encrypted_key')
    .eq('org_id', profile.org_id)
    .eq('provider', 'anthropic')
    .maybeSingle()

  if (!credential || !credential.enabled) {
    return { ok: false, error: 'AI polish is not enabled for your organization' }
  }

  let apiKey: string
  try {
    apiKey = decryptSecret(credential.encrypted_key)
  } catch {
    return { ok: false, error: 'Could not decrypt the stored API key' }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content:
              'Rewrite the following chase message to a rental applicant so it reads naturally and courteously. Keep every requested item exactly as named — do not add, remove, or change which documents are being requested, and do not invent any facts. Return only the rewritten message, nothing else.\n\n' +
              draftBody,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        ok: false,
        error: `Anthropic API error (${response.status}): ${errorText}`,
      }
    }

    const data: { content?: { text?: string }[] } = await response.json()
    const text = data.content?.[0]?.text

    if (!text) {
      return { ok: false, error: 'Anthropic returned no text' }
    }

    await supabase.from('audit_log').insert({
      case_file_id: caseFileId,
      event_type: 'chase_message_polished',
      event_payload: { method: 'llm', provider: 'anthropic' },
      actor: user.id,
    })

    return { ok: true, text }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error calling Anthropic',
    }
  }
}
