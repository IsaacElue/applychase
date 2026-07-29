import type { HTMLAttributes } from 'react'

// docs/DESIGN.md §4 — 2px radius (sharper than cards), reads as a
// "stamped label" rather than a soft UI chip.
export type BadgeVariant = 'jurisdiction' | 'neutral'

const VARIANTS: Record<BadgeVariant, string> = {
  jurisdiction: 'bg-folder-tan text-white',
  neutral: 'border border-rule text-ink-soft bg-transparent',
}

export function Badge({
  variant = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-block rounded-tag px-2 py-0.5 font-mono text-xs tracking-wide ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
