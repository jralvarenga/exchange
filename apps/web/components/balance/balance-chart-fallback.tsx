'use client'

import { useId } from 'react'

/** Fades the placeholder into the page at both edges, like the real chart. */
const edgeFade =
  'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

/** A gentle rising curve that sits where the equity line will draw. */
const ghostLine =
  'M0 62 C 8 58, 12 66, 20 60 S 32 44, 40 50 S 52 64, 60 52 S 72 34, 80 38 S 92 26, 100 22'

/** Draws a pulsing ghost of the equity curve while history loads. */
export function BalanceChartFallback() {
  const rawId = useId()
  const gradientId = `balance-ghost-${rawId.replace(/:/g, '')}`

  return (
    <div
      className="size-full animate-pulse motion-reduce:animate-none"
      role="status"
      style={{ WebkitMaskImage: edgeFade, maskImage: edgeFade }}
    >
      <svg
        aria-hidden="true"
        className="size-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--muted-foreground)"
              stopOpacity={0.16}
            />
            <stop
              offset="55%"
              stopColor="var(--muted-foreground)"
              stopOpacity={0.05}
            />
            <stop
              offset="100%"
              stopColor="var(--muted-foreground)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <path
          d={`${ghostLine} L 100 100 L 0 100 Z`}
          fill={`url(#${gradientId})`}
        />
        <path
          d={ghostLine}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeLinecap="round"
          strokeOpacity={0.3}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="sr-only">Loading balance history</span>
    </div>
  )
}
