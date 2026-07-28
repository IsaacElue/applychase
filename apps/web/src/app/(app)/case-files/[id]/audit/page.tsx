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

const STATUS_STYLES: Record<CaseItem['status'], string> = {
  received: 'bg-green-50 text-green-700',
  missing: 'bg-amber-50 text-amber-700',
  flagged: 'bg-red-50 text-red-700',
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
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          &larr; Back to case file
        </Link>
        <PrintButton />
      </div>

      <div className="mb-6 border-b border-slate-200 pb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Audit Packet — {caseFile.applicants?.name}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {caseFile.applicants?.properties.address}
          {caseFile.applicants?.properties.unit
            ? ` #${caseFile.applicants.properties.unit}`
            : ''}{' '}
          &middot; {caseFile.applicants?.properties.organizations?.name}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Case file opened {new Date(caseFile.created_at).toLocaleString()}
          {' '}&middot; {caseFile.requirement_packs.jurisdiction_code}{' '}
          requirement pack v{caseFile.requirement_packs.version} &middot;{' '}
          {receivedCount}/{caseFile.case_items.length} items received
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Packet generated {new Date().toLocaleString()}
        </p>
      </div>

      <div className="mb-8 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        This packet documents which items were received and when. It reflects
        document intake only — <strong>no automated accept/deny decision
        was made</strong> about this applicant by ApplyChase or any part of
        this system.
      </div>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Requirement items
        </h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Received</th>
              <th className="py-2 pr-2">Matched by</th>
              <th className="py-2">Reviewed by</th>
            </tr>
          </thead>
          <tbody>
            {caseFile.requirement_packs.requirements.map((requirement) => {
              const item = itemsByKey.get(requirement.key)
              if (!item) return null

              return (
                <tr key={requirement.key} className="border-b border-slate-100">
                  <td className="py-2 pr-2 align-top">
                    <p className="font-medium text-slate-900">
                      {requirement.label}
                    </p>
                    {item.source_text && (
                      <p className="mt-1 text-xs text-slate-500">
                        &ldquo;{item.source_text}&rdquo;
                      </p>
                    )}
                  </td>
                  <td className="py-2 pr-2 align-top">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 pr-2 align-top text-xs text-slate-500">
                    {item.received_at
                      ? new Date(item.received_at).toLocaleString()
                      : '—'}
                  </td>
                  <td className="py-2 pr-2 align-top text-xs text-slate-500">
                    {item.matched_by ?? (item.reviewed_by ? 'manual' : '—')}
                    {item.matched_confidence !== null
                      ? ` (${Math.round(item.matched_confidence * 100)}%)`
                      : ''}
                  </td>
                  <td className="py-2 align-top text-xs text-slate-500">
                    {item.users?.email ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {sortedChaseMessages.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            Chase messages
          </h3>
          <ul className="space-y-2">
            {sortedChaseMessages.map((message) => (
              <li
                key={message.id}
                className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                <p className="mb-1 font-medium text-slate-500">
                  {message.sent_at
                    ? new Date(message.sent_at).toLocaleString()
                    : 'Not sent'}{' '}
                  &middot; {message.method}
                </p>
                <p className="whitespace-pre-wrap">{message.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Full audit trail
        </h3>
        <ul className="space-y-1 text-xs text-slate-600">
          {sortedAuditLog.map((entry) => (
            <li key={entry.id} className="border-b border-slate-100 py-1.5">
              <span className="text-slate-400">
                {new Date(entry.created_at).toLocaleString()}
              </span>{' '}
              &middot; <span className="font-medium">{entry.event_type}</span>
              {entry.users?.email ? ` by ${entry.users.email}` : ''}
              {Object.keys(entry.event_payload).length > 0 && (
                <span className="text-slate-400">
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
