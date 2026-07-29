// Dashboard "at a glance" indicator (docs/DESIGN.md §5). SVG math and
// color logic ported from docs/reference-prototype.html's ringSvg() —
// grey when nothing's in, red while partial, green only once complete.
export function CompletenessRing({
  done,
  total,
}: {
  done: number
  total: number
}) {
  const pct = total > 0 ? done / total : 0
  const radius = 13
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const color =
    pct === 1
      ? 'var(--color-verified)'
      : pct === 0
        ? 'var(--color-rule)'
        : 'var(--color-stamp-red)'

  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke="var(--color-rule)"
        strokeWidth={3}
      />
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 16 16)"
      />
    </svg>
  )
}
