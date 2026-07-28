import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Applicant, CaseItem, Property, RequirementPack } from '@/lib/types'
import { classifyPastedText, setCaseItemStatus } from './actions'

interface CaseFileDetail {
  id: string
  created_at: string
  applicants: (Applicant & { properties: Property }) | null
  requirement_packs: RequirementPack
  case_items: CaseItem[]
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
      applicants ( *, properties ( * ) ),
      requirement_packs ( * ),
      case_items ( * )
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

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
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

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-900">
          Check pasted text against requirements
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Paste an email, note, or document description from the applicant.
          It will be matched against outstanding requirements by keyword —
          no AI call is made.
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
                        ? ` (${Math.round(item.matched_confidence * 100)}% keyword match)`
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
