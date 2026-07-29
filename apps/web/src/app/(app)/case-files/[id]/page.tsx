import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildChaseMessage } from '@/lib/chase/template'
import type {
  Applicant,
  CaseItem,
  ChaseMessage,
  Property,
  RequirementPack,
} from '@/lib/types'
import { classifyPastedText, setCaseItemStatus } from './actions'
import { ChaseMessagePanel } from './ChaseMessagePanel'

interface CaseFileDetail {
  id: string
  created_at: string
  applicants:
    | (Applicant & {
        properties: Property & { organizations: { name: string } | null }
      })
    | null
  requirement_packs: RequirementPack
  case_items: CaseItem[]
  chase_messages: ChaseMessage[]
}

const STATUS_STYLES: Record<CaseItem['status'], string> = {
  received: 'bg-green-50 text-green-700',
  missing: 'bg-amber-50 text-amber-700',
  flagged: 'bg-red-50 text-red-700',
}

export default async function CaseFileDetailPage({
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
      case_items ( * ),
      chase_messages ( * )
    `
    )
    .eq('id', id)
    .single<CaseFileDetail>()

  if (!caseFile) {
    notFound()
  }

  const itemsByKey = new Map(
    caseFile.case_items.map((item) => [item.requirement_key, item])
  )

  const missingLabels = caseFile.requirement_packs.requirements
    .filter((requirement) => itemsByKey.get(requirement.key)?.status !== 'received')
    .map((requirement) => requirement.label)

  const chaseMessageBody = buildChaseMessage({
    applicantName: caseFile.applicants?.name ?? 'there',
    orgName: caseFile.applicants?.properties.organizations?.name,
    missingLabels,
  })

  const sortedChaseMessages = [...caseFile.chase_messages].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const { data: credential } = await supabase
    .from('llm_credentials')
    .select('enabled')
    .eq('provider', 'anthropic')
    .maybeSingle<{ enabled: boolean }>()

  const aiPolishEnabled = credential?.enabled ?? false

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {caseFile.applicants?.name}
          </h2>
          <p className="text-sm text-slate-500">
            {caseFile.applicants?.properties.address}
            {caseFile.applicants?.properties.unit
              ? ` #${caseFile.applicants.properties.unit}`
              : ''}{' '}
            &middot; {caseFile.requirement_packs.jurisdiction_code} requirement
            pack v{caseFile.requirement_packs.version}
          </p>
        </div>
        <Link
          href={`/case-files/${caseFile.id}/audit`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          View audit packet
        </Link>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-900">
          Log what the applicant sent you
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Paste in the applicant&rsquo;s email or message and this will check
          it against what&rsquo;s still outstanding, marking anything it recognizes
          as received automatically — no need to review each item by hand.
          Matching happens locally by keyword and text similarity; it never
          calls out to an AI service.
        </p>
        <form action={classifyPastedText} className="space-y-3">
          <input type="hidden" name="case_file_id" value={caseFile.id} />
          <textarea
            name="source_text"
            required
            rows={4}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
            placeholder="e.g. Attached is my driver's license and last two pay stubs..."
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Check against requirements
          </button>
        </form>
      </div>

      {missingLabels.length > 0 ? (
        <div className="mb-8">
          <ChaseMessagePanel
            caseFileId={caseFile.id}
            initialBody={chaseMessageBody}
            aiPolishEnabled={aiPolishEnabled}
          />
        </div>
      ) : (
        <p className="mb-8 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Everything&rsquo;s been received for this applicant — there&rsquo;s
          nothing left to chase.
        </p>
      )}

      {sortedChaseMessages.length > 0 && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-900">
            Chase message history
          </h3>
          <ul className="space-y-3">
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
        </div>
      )}

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {caseFile.requirement_packs.requirements.map((requirement) => {
          const item = itemsByKey.get(requirement.key)
          if (!item) return null

          return (
            <li key={requirement.key} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {requirement.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {requirement.description}
                  </p>
                  {item.status === 'received' && item.source_text && (
                    <p className="mt-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      Matched from pasted text
                      {item.matched_confidence !== null
                        ? ` (${Math.round(item.matched_confidence * 100)}% ${item.matched_by === 'embedding' ? 'similarity' : 'keyword'} match)`
                        : ''}
                      : “{item.source_text}”
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <form action={setCaseItemStatus} className="mt-3 flex gap-2">
                <input type="hidden" name="case_item_id" value={item.id} />
                <input
                  type="hidden"
                  name="case_file_id"
                  value={caseFile.id}
                />
                <button
                  type="submit"
                  name="status"
                  value="received"
                  disabled={item.status === 'received'}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Mark received
                </button>
                <button
                  type="submit"
                  name="status"
                  value="missing"
                  disabled={item.status === 'missing'}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Mark missing
                </button>
              </form>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
