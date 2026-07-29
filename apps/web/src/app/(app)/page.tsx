import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CaseItem } from '@/lib/types'
import { loadDemoData } from './actions'

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Case Files</h2>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== 'production' && (
            <form action={loadDemoData}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Load demo data
              </button>
            </form>
          )}
          <Link
            href="/applicants/new"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New Applicant
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-slate-200 text-sm">
        <Link
          href="/"
          className={`-mb-px border-b-2 px-1 pb-2 ${
            showArchived
              ? 'border-transparent text-slate-500 hover:text-slate-900'
              : 'border-slate-900 font-medium text-slate-900'
          }`}
        >
          Case Files
        </Link>
        <Link
          href="/?view=archived"
          className={`-mb-px border-b-2 px-1 pb-2 ${
            showArchived
              ? 'border-slate-900 font-medium text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Archived
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {caseFiles && caseFiles.length === 0 && (
        <p className="text-sm text-slate-500">
          {showArchived
            ? 'No archived case files. Case files you archive (leased, applicant withdrew, duplicate entry, etc.) show up here instead of the default list — they’re never deleted.'
            : 'A case file tracks which documents an applicant still owes you — application, ID, proof of income, and so on — so nothing gets lost and you have a timestamped record of what came in and when. To start one, add a property, then add an applicant for it.'}
        </p>
      )}

      {caseFiles && caseFiles.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {caseFiles.map((caseFile) => {
            const received = caseFile.case_items.filter(
              (item) => item.status === 'received'
            ).length
            const total = caseFile.case_items.length
            const complete = total > 0 && received === total

            return (
              <li key={caseFile.id}>
                <Link
                  href={`/case-files/${caseFile.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {caseFile.applicants?.name ?? 'Unknown applicant'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {caseFile.applicants?.properties?.address}
                      {caseFile.applicants?.properties?.unit
                        ? ` #${caseFile.applicants.properties.unit}`
                        : ''}
                    </p>
                  </div>
                  {showArchived ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {caseFile.archive_reason}
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        complete
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {received}/{total} received
                    </span>
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
