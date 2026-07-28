'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { matchText } from '@/lib/matching/rules'
import type { CaseItem, RequirementPack } from '@/lib/types'

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

  const matches = matchText(sourceText, pendingRequirements)

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
        matched_by: 'rule',
        received_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    await supabase.from('audit_log').insert({
      case_file_id: caseFileId,
      event_type: 'case_item_matched',
      event_payload: {
        requirement_key: match.requirementKey,
        matched_keywords: match.matchedKeywords,
        confidence: match.confidence,
        matched_by: 'rule',
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
