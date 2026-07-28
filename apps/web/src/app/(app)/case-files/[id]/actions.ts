'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { matchText } from '@/lib/matching/rules'
import {
  classifyByEmbedding,
  EMBEDDING_MATCH_THRESHOLD,
} from '@/lib/matching/embeddings'
import type { CaseItem, MatchedBy, RequirementPack } from '@/lib/types'

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
      const results = await classifyByEmbedding(
        sourceText,
        remainingRequirements.map((requirement) => ({
          key: requirement.key,
          description: requirement.description,
        }))
      )
      embeddingMatches = results
        .filter((result) => result.score >= EMBEDDING_MATCH_THRESHOLD)
        .map((result) => ({
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

  const supabase = await createClient()

  const { error } = await supabase.from('chase_messages').insert({
    case_file_id: caseFileId,
    method: 'template',
    body,
    sent_at: new Date().toISOString(),
  })

  if (!error) {
    await supabase.from('audit_log').insert({
      case_file_id: caseFileId,
      event_type: 'chase_message_sent',
      event_payload: { method: 'template' },
    })
  }

  revalidatePath(`/case-files/${caseFileId}`)
}
