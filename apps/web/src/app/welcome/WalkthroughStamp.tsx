'use client'

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { Stamp } from '@/components/Stamp'

// The one "theatrical" moment on the marketing page, same restraint rule
// as the app itself (docs/DESIGN.md §3/§7) — this is the real Stamp
// component doing its real transition, not a marketing recreation of it.
// The `key` swap forces a fresh mount when it scrolls into view, which is
// what makes Framer Motion's mount-in animation actually play once.
export function WalkthroughStamp() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="inline-block">
      {isInView ? (
        <Stamp key="received" status="received" animate />
      ) : (
        <Stamp key="missing" status="missing" />
      )}
    </div>
  )
}
