import type { RequirementDefinition } from '@/lib/matching/rules'

export interface Property {
  id: string
  org_id: string
  address: string
  unit: string | null
  jurisdiction_code: string
  created_at: string
}

export interface Applicant {
  id: string
  property_id: string
  name: string
  email: string | null
  phone: string | null
  status: 'active' | 'complete' | 'archived'
  created_at: string
}

export interface RequirementPack {
  id: string
  jurisdiction_code: string
  version: number
  requirements: RequirementDefinition[]
}

export type CaseItemStatus = 'missing' | 'received' | 'flagged'
export type MatchedBy = 'rule' | 'embedding' | 'llm'

export interface CaseItem {
  id: string
  case_file_id: string
  requirement_key: string
  status: CaseItemStatus
  source_text: string | null
  matched_confidence: number | null
  matched_by: MatchedBy | null
  received_at: string | null
  reviewed_by: string | null
  created_at: string
}

export interface CaseFile {
  id: string
  applicant_id: string
  requirement_pack_id: string
  created_at: string
}

export type ChaseMessageMethod = 'template' | 'llm' | 'ollama'

export interface ChaseMessage {
  id: string
  case_file_id: string
  method: ChaseMessageMethod
  body: string
  sent_at: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  case_file_id: string
  event_type: string
  event_payload: Record<string, unknown>
  actor: string | null
  created_at: string
}

export type LlmProvider = 'anthropic' | 'openai'

export interface LlmCredential {
  id: string
  org_id: string
  provider: LlmProvider
  enabled: boolean
  created_at: string
  updated_at: string
}
