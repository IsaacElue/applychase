'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Print / Save as PDF
    </button>
  )
}
