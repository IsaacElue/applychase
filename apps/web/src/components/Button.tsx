import type { ButtonHTMLAttributes } from 'react'

// Shared button styling (docs/DESIGN.md §4) — used both as an actual
// <button> here and via `buttonVariants()` on Link elements styled as
// buttons, so the two never drift apart.
export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

const BASE =
  'inline-flex items-center justify-center rounded-card px-3 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-stamp-red',
  secondary:
    'border border-rule bg-transparent text-ink hover:border-ink',
  destructive:
    'border border-stamp-red bg-transparent text-stamp-red hover:bg-stamp-red hover:text-white',
}

export function buttonVariants(variant: ButtonVariant = 'primary') {
  return `${BASE} ${VARIANTS[variant]}`
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${buttonVariants(variant)} ${className}`} {...props} />
  )
}
