'use client'

import { InputGroupAddon } from '@workspace/ui/components/input-group'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AssetCombobox } from '@/components/assets/asset-combobox'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import { getTradeHref } from '@/lib/trade/symbol'

/** Searches Alpaca assets from the navbar and opens the chosen one on the Trade screen. */
export function NavbarSearch() {
  const router = useRouter()
  // Remounting clears the query once the trader lands on the chosen asset.
  const [resetKey, setResetKey] = useState(0)

  /** Navigates to the selected asset and empties the search. */
  function handleSelect(asset: AssetSearchResult | null): void {
    if (!asset) {
      return
    }

    router.push(getTradeHref(asset.symbol))
    setResetKey((key) => key + 1)
  }

  return (
    <AssetCombobox
      className="h-9"
      key={resetKey}
      leading={
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
      }
      onValueChange={handleSelect}
      placeholder="Search…"
      value={null}
    />
  )
}
