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
import { ArchiveCaseFileForm } from './ArchiveCaseFileForm'
import { Stamp } from '@/components/Stamp'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Textarea } from '@/components/Input'
import { Button, buttonVariants } from '@/components/Button'

interface CaseFileDetail {
  id: string
  created_at: string
  archived_at: string | null
  archive_reason: string | null
  applicants:
    | (Applicant & {
        properties: Property & { organizations: { name: string } | null }
      })
    | null
  requirement_packs: RequirementPack
  case_items: CaseItem[]
  chase_messages: ChaseMessage[]
}

export default async function CaseFileDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ justStamped?: string; error?: string }>
}) {
  const { id } = await params
  const { justStamped, error } = await searchParams
  const justStampedKeys = new Set(
    justStamped ? justStamped.split(',') : []
  )
  const supabase = await createClient()

  const { data: caseFile } = await supabase
    .from('case_files')
    .select(
      `
      id,
      created_at,
      archived_at,
      archive_reason,
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">
            {caseFile.applicants?.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              {caseFile.applicants?.properties.address}
              {caseFile.applicants?.properties.unit
                ? ` #${caseFile.applicants.properties.unit}`
                : ''}
            </span>
            <Badge variant="jurisdiction">
              {caseFile.requirement_packs.jurisdiction_code} v
              {caseFile.requirement_packs.version}
            </Badge>
          </p>
        </div>
        <Link
          href={`/case-files/${caseFile.id}/audit`}
          className={buttonVariants('secondary')}
        >
          View audit packet
        </Link>
      </div>

      <p className="mb-6 rounded-card border border-folder-tan/40 bg-folder-tan/10 px-3 py-2 text-xs text-ink-soft">
        This case file tracks intake and documentation only. ApplyChase never
        makes an automated accept/deny decision about this applicant.
      </p>

      {error && (
        <p className="mb-6 rounded-card bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {caseFile.archived_at && (
        <p className="mb-6 rounded-card bg-card px-3 py-2 text-sm text-ink-soft">
          Archived {new Date(caseFile.archived_at).toLocaleString()} &middot;{' '}
          {caseFile.archive_reason}
        </p>
      )}

      <Card className="mb-8">
        <h3 className="mb-2 text-sm font-medium text-ink">
          Log what the applicant sent you
        </h3>
        <p className="mb-3 text-xs text-ink-soft">
          Paste in the applicant&rsquo;s email or message. It&rsquo;s checked
          against what&rsquo;s still outstanding, and anything recognized is
          marked received automatically. Matching happens locally, by
          keyword and text similarity. No AI call, ever.
        </p>
        <form action={classifyPastedText} className="space-y-3">
          <input type="hidden" name="case_file_id" value={caseFile.id} />
          <Textarea
            name="source_text"
            required
            rows={4}
            placeholder="e.g. Attached is my driver's license and last two pay stubs..."
          />
          <Button type="submit">Check against requirements</Button>
        </form>
      </Card>

      {missingLabels.length > 0 ? (
        <div className="mb-8">
          <ChaseMessagePanel
            caseFileId={caseFile.id}
            initialBody={chaseMessageBody}
            aiPolishEnabled={aiPolishEnabled}
          />
        </div>
      ) : (
        <p className="mb-8 rounded-card bg-verified/10 px-3 py-2 text-sm text-verified">
          Everything&rsquo;s been received. Nothing left to chase.
        </p>
      )}

      {sortedChaseMessages.length > 0 && (
        <Card className="mb-8">
          <h3 className="mb-3 text-sm font-medium text-ink">
            Chase message history
          </h3>
          <ul className="space-y-3">
            {sortedChaseMessages.map((message) => (
              <li
                key={message.id}
                className="rounded-card bg-paper px-3 py-2 text-xs text-ink-soft"
              >
                <p className="mb-1 font-mono font-medium text-ink-soft">
                  {message.sent_at
                    ? new Date(message.sent_at).toLocaleString()
                    : 'Not sent'}{' '}
                  &middot; {message.method}
                </p>
                <p className="whitespace-pre-wrap text-ink">{message.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {caseFile.requirement_packs.requirements.map((requirement) => {
          const item = itemsByKey.get(requirement.key)
          if (!item) return null

          return (
            <Card key={requirement.key} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {requirement.label}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {requirement.description}
                  </p>
                </div>
                <div className="shrink-0">
                  <Stamp
                    status={item.status === 'received' ? 'received' : 'missing'}
                    animate={justStampedKeys.has(item.requirement_key)}
                  />
                </div>
              </div>

              {item.status === 'received' && item.source_text && (
                <p className="rounded-card bg-paper px-2 py-1 font-mono text-xs text-ink-soft">
                  Matched from pasted text
                  {item.matched_confidence !== null
                    ? ` (${Math.round(item.matched_confidence * 100)}% ${item.matched_by === 'embedding' ? 'similarity' : 'keyword'} match)`
                    : ''}
                  : &ldquo;{item.source_text}&rdquo;
                </p>
              )}

              <form action={setCaseItemStatus} className="mt-auto flex gap-2">
                <input type="hidden" name="case_item_id" value={item.id} />
                <input type="hidden" name="case_file_id" value={caseFile.id} />
                <button
                  type="submit"
                  name="status"
                  value="received"
                  disabled={item.status === 'received'}
                  className="rounded-card border border-rule px-2.5 py-1 text-xs text-ink-soft transition-colors duration-150 hover:border-ink hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Mark received
                </button>
                <button
                  type="submit"
                  name="status"
                  value="missing"
                  disabled={item.status === 'missing'}
                  className="rounded-card border border-rule px-2.5 py-1 text-xs text-ink-soft transition-colors duration-150 hover:border-ink hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Mark missing
                </button>
              </form>
            </Card>
          )
        })}
      </div>

      {!caseFile.archived_at && (
        <div className="mt-8 border-t border-rule pt-4">
          <ArchiveCaseFileForm caseFileId={caseFile.id} />
        </div>
      )}
    </div>
  )
}
