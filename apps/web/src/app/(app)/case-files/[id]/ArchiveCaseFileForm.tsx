'use client'

import { useState } from 'react'
import { archiveCaseFile } from './actions'

const PRESET_REASONS = ['Leased', 'Applicant withdrew', 'Duplicate entry']
const OTHER = 'Other'

export function ArchiveCaseFileForm({ caseFileId }: { caseFileId: string }) {
  const [selected, setSelected] = useState(PRESET_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const isOther = selected === OTHER
  const reason = isOther ? customReason.trim() : selected

  return (
    <form action={archiveCaseFile} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="case_file_id" value={caseFileId} />
      <input type="hidden" name="reason" value={reason} />
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:outline-none"
      >
        {PRESET_REASONS.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value={OTHER}>Other&hellip;</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={customReason}
          onChange={(event) => setCustomReason(event.target.value)}
          placeholder="Reason"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:outline-none"
        />
      )}
      <button
        type="submit"
        disabled={!reason}
        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        Archive this case file
      </button>
    </form>
  )
}
