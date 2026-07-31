import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { CaseItem } from '@/lib/types'
import { loadDemoData } from './actions'
import { buttonVariants } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { CompletenessRing } from '@/components/CompletenessRing'

interface CaseFileRow {
  id: string
  created_at: string
  archived_at: string | null
  archive_reason: string | null
  applicants: {
    name: string
    properties: {
      address: string
      unit: string | null
    } | null
  } | null
  case_items: Pick<CaseItem, 'status'>[]
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const showArchived = view === 'archived'
  const supabase = await createClient()

  let query = supabase
    .from('case_files')
    .select(
      `
      id,
      created_at,
      archived_at,
      archive_reason,
      applicants ( name, properties ( address, unit ) ),
      case_items ( status )
    `
    )
    .order('created_at', { ascending: false })

  query = showArchived
    ? query.not('archived_at', 'is', null)
    : query.is('archived_at', null)

  const { data: caseFiles, error } = await query.returns<CaseFileRow[]>()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink">
          Case Files
        </h2>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== 'production' && (
            <form action={loadDemoData}>
              <button type="submit" className={buttonVariants('secondary')}>
                Load demo data
              </button>
            </form>
          )}
          <Link href="/applicants/new" className={buttonVariants('primary')}>
            + New Applicant
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-rule text-sm">
        <Link
          href="/"
          className={`-mb-px rounded-t-sm border-b-2 px-1 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
            showArchived
              ? 'border-transparent text-ink-soft hover:text-ink'
              : 'border-ink font-medium text-ink'
          }`}
        >
          Case Files
        </Link>
        <Link
          href="/?view=archived"
          className={`-mb-px rounded-t-sm border-b-2 px-1 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
            showArchived
              ? 'border-ink font-medium text-ink'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Archived
        </Link>
      </div>

      {error && (
        <p className="rounded-card bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {caseFiles && caseFiles.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          message={
            showArchived
              ? 'No archived case files yet. Archived files (leased, withdrew, duplicate entry) stay off the main list, but are never deleted.'
              : 'A case file tracks which documents each applicant still owes you, so nothing gets lost. Add a property, then an applicant, to get started.'
          }
          actionLabel={showArchived ? undefined : '+ New Applicant'}
          actionHref={showArchived ? undefined : '/applicants/new'}
        />
      )}

      {caseFiles && caseFiles.length > 0 && (
        <ul className="divide-y divide-rule rounded-card border border-rule bg-card">
          {caseFiles.map((caseFile) => {
            const received = caseFile.case_items.filter(
              (item) => item.status === 'received'
            ).length
            const total = caseFile.case_items.length

            return (
              <li key={caseFile.id}>
                <Link
                  href={`/case-files/${caseFile.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3">
                    {!showArchived && (
                      <CompletenessRing done={received} total={total} />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {caseFile.applicants?.name ?? 'Unknown applicant'}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {caseFile.applicants?.properties?.address}
                        {caseFile.applicants?.properties?.unit
                          ? ` #${caseFile.applicants.properties.unit}`
                          : ''}
                        {' · '}
                        {received}/{total}
                      </p>
                    </div>
                  </div>
                  {showArchived && (
                    <Badge variant="neutral">{caseFile.archive_reason}</Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
