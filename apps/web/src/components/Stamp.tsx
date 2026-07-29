'use client'

import { motion, useReducedMotion } from 'framer-motion'

// The signature element (docs/DESIGN.md §3). Resting visuals match
// docs/reference-prototype.html's `.stamp` classes exactly; the reference
// itself has no motion, so the mount-in animation is new, layered on top.
export function Stamp({
  status,
  animate = false,
}: {
  status: 'missing' | 'received'
  animate?: boolean
}) {
  const prefersReducedMotion = useReducedMotion()
  const isReceived = status === 'received'
  const shouldAnimateIn = animate && isReceived && !prefersReducedMotion

  return (
    <motion.span
      className={
        'inline-block rounded-[2px] px-2.5 py-1 font-mono text-[10.5px] tracking-wide ' +
        (isReceived
          ? 'border-[1.5px] border-stamp-red bg-stamp-red/[0.06] font-semibold text-stamp-red'
          : 'border-[1.5px] border-dashed border-rule bg-transparent text-ink-soft')
      }
      initial={shouldAnimateIn ? { opacity: 0, scale: 0.5, rotate: 0 } : false}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: isReceived ? -3 : 0,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {isReceived ? 'RECEIVED' : 'PENDING'}
    </motion.span>
  )
}
