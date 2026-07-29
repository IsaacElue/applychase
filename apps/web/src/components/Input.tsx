import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Shared field styling (docs/DESIGN.md §4). The focus ring is the
// accessibility floor called out in the spec — must stay visible for
// keyboard navigation, non-negotiable.
const FIELD =
  'w-full rounded-card border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20'

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD} ${className}`} {...props} />
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD} ${className}`} {...props} />
}

export function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD} ${className}`} {...props} />
}
