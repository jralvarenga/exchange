'use client'

import { useEffect, useRef, useState } from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'

export type PriceFlash = 'down' | 'up' | null

/** How long a price change stays highlighted, in milliseconds. */
export const priceFlashDuration = 600

/**
 * Returns the direction of the latest price change for 600ms after it lands,
 * then null. Reduced motion turns the flash off.
 */
export function usePriceFlash(value: number | undefined): PriceFlash {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const previous = useRef(value)
  const [flash, setFlash] = useState<PriceFlash>(null)

  useEffect(() => {
    const last = previous.current
    previous.current = value

    if (
      reducedMotion ||
      value === undefined ||
      last === undefined ||
      value === last
    ) {
      // A suppressed change also ends any flash still showing.
      setFlash(null)
      return
    }

    setFlash(value > last ? 'up' : 'down')
    const timer = window.setTimeout(() => setFlash(null), priceFlashDuration)

    return () => window.clearTimeout(timer)
  }, [reducedMotion, value])

  return reducedMotion ? null : flash
}
