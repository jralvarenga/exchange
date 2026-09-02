'use client'

import Image from 'next/image'
import { useState } from 'react'

import type { AssetSearchResult } from '@/lib/alpaca/schemas'

interface Props {
  assetClass: AssetSearchResult['assetClass']
  symbol: string
}

/** Displays an asset logo with a compact text fallback. */
export function AssetIcon({ assetClass, symbol }: Props) {
  const [hasError, setHasError] = useState(false)
  const primarySymbol = symbol.split('/')[0] ?? symbol
  const logoSymbol =
    assetClass === 'crypto'
      ? primarySymbol.replace(/(?:USDC|USDT|USD)$/u, '')
      : primarySymbol
  const logoType = assetClass === 'crypto' ? 'crypto' : 'symbol'
  const logoUrl = `https://assets.parqet.com/logos/${logoType}/${encodeURIComponent(logoSymbol)}?format=png&size=64`
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
