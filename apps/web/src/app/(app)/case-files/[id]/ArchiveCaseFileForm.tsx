'use client'

import { useState } from 'react'
import { archiveCaseFile } from './actions'
import { Select, Input } from '@/components/Input'
import { buttonVariants } from '@/components/Button'

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
      <Select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="w-auto py-1.5 text-xs"
      >
        {PRESET_REASONS.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value={OTHER}>Other&hellip;</option>
      </Select>
      {isOther && (
        <Input
          type="text"
          value={customReason}
          onChange={(event) => setCustomReason(event.target.value)}
          placeholder="Reason"
          className="w-auto py-1.5 text-xs"
        />
      )}
      <button
        type="submit"
        disabled={!reason}
        className={`${buttonVariants('destructive')} px-2.5 py-1.5 text-xs`}
      >
        Archive this case file
      </button>
    </form>
  )
}
