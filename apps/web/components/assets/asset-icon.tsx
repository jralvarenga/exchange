'use client'

import Image from 'next/image'
import { useState } from 'react'

import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import { getAssetLogoSymbol, getAssetLogoUrl } from '@/lib/assets/logo'

interface Props {
  assetClass: AssetSearchResult['assetClass']
  symbol: string
}

/** Displays an asset logo with a compact text fallback. */
export function AssetIcon({ assetClass, symbol }: Props) {
  const [hasError, setHasError] = useState(false)
  const logoSymbol = getAssetLogoSymbol({ assetClass, symbol })
  const logoUrl = getAssetLogoUrl({ assetClass, symbol })
  const symbolMark = logoSymbol.slice(0, 2).toLocaleLowerCase('en-US') || '—'

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full">
      {hasError ? (
        <span aria-hidden="true" className="font-medium text-muted-foreground">
          {symbolMark}
        </span>
      ) : (
        <Image
          alt=""
          className="size-8 rounded-full object-contain"
          height={32}
          onError={() => setHasError(true)}
          src={logoUrl}
          width={32}
        />
      )}
    </span>
  )
}
