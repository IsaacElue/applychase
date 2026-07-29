import { createClient } from '@/lib/supabase/server'
import type { CaseItem, MatchedBy } from '@/lib/types'

export interface CaseItemMatch {
  requirementKey: string
  confidence: number
  matchedBy: MatchedBy
  matchedKeywords?: string[]
}

// Shared by the real classifyPastedText flow and demo-data seeding, so a
// seeded demo case file goes through the exact same persistence path a real
// paste does — same case_items update, same audit_log shape.
export async function applyCaseItemMatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseFileId: string,
  pendingItems: Pick<CaseItem, 'id' | 'requirement_key'>[],
  matches: CaseItemMatch[],
  sourceText: string
) {
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
}
