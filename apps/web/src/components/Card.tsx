import type { HTMLAttributes } from 'react'

// docs/DESIGN.md §4 — --card background, --rule border, no shadow at rest.
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-rule bg-card p-4 ${className}`}
      {...props}
    />
  )
}
