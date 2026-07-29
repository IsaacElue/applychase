'use client'

import { buttonVariants } from '@/components/Button'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`print:hidden ${buttonVariants('primary')}`}
    >
      Print / Save as PDF
    </button>
  )
}
