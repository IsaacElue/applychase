'use client'

import { useState } from 'react'
import { sendChaseMessage } from './actions'

export function ChaseMessagePanel({
  caseFileId,
  initialBody,
}: {
  caseFileId: string
  initialBody: string
}) {
  const [body, setBody] = useState(initialBody)
  const [copied, setCopied] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-slate-900">
        Chase message
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Fill-in-the-blank template — edit as needed, then copy it into your
        own email client. &ldquo;Mark as sent&rdquo; only records it in this
        case file&rsquo;s audit trail; it does not send an email itself.
      </p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={8}
        className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(body)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        <form action={sendChaseMessage}>
          <input type="hidden" name="case_file_id" value={caseFileId} />
          <input type="hidden" name="body" value={body} />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Mark as sent
          </button>
        </form>
      </div>
    </div>
  )
}
