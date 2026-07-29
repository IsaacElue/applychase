import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { buttonVariants } from './Button'

// docs/DESIGN.md §4 — never just grey placeholder text: an icon, the
// explanatory copy, and (when there's somewhere to go) one clear action.
export function EmptyState({
  icon: Icon,
  message,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon
  message: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-rule bg-card px-6 py-12 text-center">
      <Icon className="h-9 w-9 text-rule" strokeWidth={1.5} aria-hidden="true" />
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonVariants('primary')}>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
