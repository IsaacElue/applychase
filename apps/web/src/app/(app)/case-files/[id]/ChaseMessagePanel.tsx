'use client'

import { useState } from 'react'
import { polishChaseMessage, sendChaseMessage } from './actions'
import type { ChaseMessageMethod } from '@/lib/types'
import { Card } from '@/components/Card'
import { buttonVariants } from '@/components/Button'

export function ChaseMessagePanel({
  caseFileId,
  initialBody,
  aiPolishEnabled,
}: {
  caseFileId: string
  initialBody: string
  aiPolishEnabled: boolean
}) {
  const [body, setBody] = useState(initialBody)
  const [method, setMethod] = useState<ChaseMessageMethod>('template')
  const [copied, setCopied] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [polishError, setPolishError] = useState<string | null>(null)

  async function handlePolish() {
    setPolishing(true)
    setPolishError(null)

    const result = await polishChaseMessage(caseFileId, body)

    if (result.ok) {
      setBody(result.text)
      setMethod('llm')
    } else {
      setPolishError(result.error)
    }

    setPolishing(false)
  }

  return (
    <Card>
      <h3 className="mb-2 text-sm font-medium text-ink">Chase message</h3>
      <p className="mb-3 text-xs text-ink-soft">
        Fill-in-the-blank template. Edit as needed, then copy it into your
        own email client. &ldquo;Mark as sent&rdquo; only logs it in this
        case file&rsquo;s audit trail. It doesn&rsquo;t send an email.
      </p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={8}
        className="block w-full rounded-card border border-rule bg-white px-3 py-3 font-mono text-sm text-ink shadow-[inset_0_2px_4px_rgba(31,42,51,0.08)] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
      />
      {polishError && (
        <p className="mt-2 rounded-card bg-red-50 px-3 py-2 text-xs text-red-700">
          {polishError}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(body)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className={buttonVariants('secondary')}
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        {aiPolishEnabled && (
          <button
            type="button"
            onClick={handlePolish}
            disabled={polishing}
            className={buttonVariants('secondary')}
          >
            {polishing ? 'Polishing…' : 'Polish with AI'}
          </button>
        )}
        <form action={sendChaseMessage}>
          <input type="hidden" name="case_file_id" value={caseFileId} />
          <input type="hidden" name="body" value={body} />
          <input type="hidden" name="method" value={method} />
          <button type="submit" className={buttonVariants('primary')}>
            Mark as sent
          </button>
        </form>
      </div>
    </Card>
  )
}
