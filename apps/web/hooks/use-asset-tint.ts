'use client'

import { getImageProps } from 'next/image'
import { useEffect, useState } from 'react'

import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import { getAssetLogoUrl } from '@/lib/assets/logo'
import { pickTint } from '@/lib/assets/tint'

interface UseAssetTintOptions {
  assetClass: AssetSearchResult['assetClass']
  symbol: string
}

const sampleSize = 32

/**
 * Samples an asset's logo and returns its dominant color as `rgb(r g b)`, or
 * null while loading or when the logo has no color. The logo is read through
 * the Next image optimizer, which serves it same-origin so the canvas can read it.
 */
export function useAssetTint(options: UseAssetTintOptions): string | null {
  const [tint, setTint] = useState<string | null>(null)
  const { src } = getImageProps({
    alt: '',
    height: sampleSize,
    src: getAssetLogoUrl(options),
    width: sampleSize,
  }).props

  useEffect(() => {
    let cancelled = false
    const image = new window.Image()

    image.decoding = 'async'
    image.onload = () => {
      if (cancelled) {
        return
      }

      try {
        const canvas = document.createElement('canvas')
        canvas.width = sampleSize
        canvas.height = sampleSize
        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (!context) {
          setTint(null)
          return
        }

        context.drawImage(image, 0, 0, sampleSize, sampleSize)
        setTint(
          pickTint(context.getImageData(0, 0, sampleSize, sampleSize).data)
        )
      } catch {
        // A logo the canvas cannot read keeps the brand color.
        setTint(null)
      }
    }
    image.onerror = () => {
      if (!cancelled) {
        setTint(null)
      }
    }
    image.src = src

    return () => {
      cancelled = true
    }
  }, [src])

  return tint
}
