import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type {
  Applicant,
  AuditLogEntry,
  CaseItem,
  ChaseMessage,
  Property,
  RequirementPack,
} from '@/lib/types'
import { PrintButton } from './PrintButton'
import { Stamp } from '@/components/Stamp'
import { Badge } from '@/components/Badge'

interface CaseItemWithReviewer extends CaseItem {
  users: { email: string } | null
}

interface AuditLogEntryWithActor extends AuditLogEntry {
  users: { email: string } | null
}

interface AuditPacketData {
  id: string
  created_at: string
  applicants:
    | (Applicant & {
        properties: Property & { organizations: { name: string } | null }
      })
    | null
  requirement_packs: RequirementPack
  case_items: CaseItemWithReviewer[]
  chase_messages: ChaseMessage[]
  audit_log: AuditLogEntryWithActor[]
}

export default async function AuditPacketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: caseFile } = await supabase
    .from('case_files')
    .select(
      `
      id,
      created_at,
      applicants ( *, properties ( *, organizations ( name ) ) ),
      requirement_packs ( * ),
      case_items ( *, users ( email ) ),
      chase_messages ( * ),
      audit_log ( *, users ( email ) )
    `
    )
    .eq('id', id)
    .single<AuditPacketData>()

  if (!caseFile) {
    notFound()
  }

  const itemsByKey = new Map(
    caseFile.case_items.map((item) => [item.requirement_key, item])
  )

  const sortedAuditLog = [...caseFile.audit_log].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const sortedChaseMessages = [...caseFile.chase_messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const receivedCount = caseFile.case_items.filter(
    (item) => item.status === 'received'
  ).length

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 print:max-w-none print:px-0">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <Link
          href={`/case-files/${caseFile.id}`}
          className="rounded-tag text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          &larr; Back to case file
        </Link>
        <PrintButton />
      </div>

      <div className="mb-6 border-b-2 border-ink pb-6">
        <h2 className="font-display text-2xl font-bold text-ink">
          Audit Packet &mdash; {caseFile.applicants?.name}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {caseFile.applicants?.properties.address}
          {caseFile.applicants?.properties.unit
            ? ` #${caseFile.applicants.properties.unit}`
            : ''}{' '}
          &middot; {caseFile.applicants?.properties.organizations?.name}
        </p>
        <p className="mt-2 font-mono text-xs text-ink-soft">
          Case file opened {new Date(caseFile.created_at).toLocaleString()}
          {' '}&middot; {caseFile.requirement_packs.jurisdiction_code}{' '}
          requirement pack v{caseFile.requirement_packs.version} &middot;{' '}
          {receivedCount}/{caseFile.case_items.length} items received
        </p>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          Packet generated {new Date().toLocaleString()}
        </p>
      </div>

      <div className="mb-8 rounded-card border border-folder-tan/40 bg-folder-tan/10 px-4 py-3 text-xs text-ink-soft">
        This packet documents which items were received and when. It reflects
        document intake only — <strong>no automated accept/deny decision
        was made</strong> about this applicant by ApplyChase or any part of
        this system.
      </div>

      <section className="mb-8">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-soft">
          Requirement items
        </h3>
        <div>
          {caseFile.requirement_packs.requirements.map((requirement) => {
            const item = itemsByKey.get(requirement.key)
            if (!item) return null

            return (
              <div
                key={requirement.key}
                className="flex items-start justify-between gap-4 border-b border-dotted border-rule py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {requirement.label}
                  </p>
                  {item.source_text && (
                    <p className="mt-0.5 max-w-md font-mono text-xs text-ink-soft">
                      &ldquo;{item.source_text}&rdquo;
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-xs text-ink-soft">
                    {item.matched_by ?? (item.reviewed_by ? 'manual' : '—')}
                    {item.matched_confidence !== null
                      ? ` (${Math.round(item.matched_confidence * 100)}%)`
                      : ''}
                    {item.users?.email ? ` · reviewed by ${item.users.email}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Stamp
                    status={item.status === 'received' ? 'received' : 'missing'}
                  />
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {item.received_at
                      ? new Date(item.received_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {sortedChaseMessages.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-soft">
            Chase messages
          </h3>
          <ul className="space-y-2">
            {sortedChaseMessages.map((message) => (
              <li
                key={message.id}
                className="rounded-card bg-card px-3 py-2 text-xs text-ink-soft"
              >
                <p className="mb-1 font-mono font-medium text-ink-soft">
                  {message.sent_at
                    ? new Date(message.sent_at).toLocaleString()
                    : 'Not sent'}{' '}
                  &middot; <Badge variant="neutral">{message.method}</Badge>
                </p>
                <p className="whitespace-pre-wrap text-ink">{message.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-soft">
          Full audit trail
        </h3>
        <ul className="space-y-1 font-mono text-xs text-ink-soft">
          {sortedAuditLog.map((entry) => (
            <li
              key={entry.id}
              className="border-b border-dotted border-rule py-1.5"
            >
              <span className="text-ink-soft/70">
                {new Date(entry.created_at).toLocaleString()}
              </span>{' '}
              &middot; <span className="font-medium text-ink">{entry.event_type}</span>
              {entry.users?.email ? ` by ${entry.users.email}` : ''}
              {Object.keys(entry.event_payload).length > 0 && (
                <span className="text-ink-soft/70">
                  {' — '}
                  {JSON.stringify(entry.event_payload)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
