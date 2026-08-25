'use client'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox'
import { LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'

import { PositionSymbol } from '@/components/portfolio/position-symbol'
import { useAssetSearch } from '@/hooks/use-asset-search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'

interface EmptyMessageOptions {
  hasError: boolean
  isSearching: boolean
  query: string
}

const SEARCH_DELAY_MS = 250

/** Searches and selects active Alpaca equities and crypto assets. */
export function AssetSearchCombobox() {
  const [inputValue, setInputValue] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(
    null
  )
  const searchInput = inputValue.trim()
  const normalizedInput = searchInput.toLocaleLowerCase('en-US')
  const debouncedQuery = useDebouncedValue(normalizedInput, SEARCH_DELAY_MS)
  const search = useAssetSearch(debouncedQuery)
  const isDebouncing = normalizedInput !== debouncedQuery
  const isSearching = isDebouncing || search.isFetching
  const assets =
    isDebouncing || search.data?.query !== debouncedQuery
      ? []
      : search.data.assets
  const emptyMessage = getEmptyMessage({
    hasError: search.isError,
    isSearching,
    query: searchInput,
  })

  return (
    <Combobox
      autoHighlight
      filter={null}
      inputValue={inputValue}
      isItemEqualToValue={(asset, value) => asset.id === value.id}
      itemToStringLabel={(asset) => asset.symbol}
      items={assets}
      onInputValueChange={setInputValue}
      onValueChange={(asset) => {
        setSelectedAsset(asset)

        if (asset) {
          setInputValue(asset.symbol)
        }
      }}
      value={selectedAsset}
    >
      <ComboboxInput
        aria-label="Search Alpaca assets"
        id="asset-symbol"
        placeholder="Search by symbol or name"
        showClear
        showTrigger={false}
      />
      <ComboboxContent
        aria-busy={isSearching}
        className="min-w-(--anchor-width) max-w-(--anchor-width) w-full"
      >
        <ComboboxEmpty>
          <span className="flex items-center gap-2">
            {isSearching ? (
              <LoaderCircleIcon
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {emptyMessage}
          </span>
        </ComboboxEmpty>
        <ComboboxList>
          {assets.map((asset) => (
            <ComboboxItem className="py-2" key={asset.id} value={asset}>
              <PositionSymbol
                assetClass={asset.assetClass}
                symbol={asset.symbol}
              />
              <span className="flex flex-1 flex-col">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-bold">
                    {asset.symbol}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {asset.assetClass === 'crypto' ? 'Crypto' : asset.exchange}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {asset.name}
                </span>
              </span>
            </ComboboxItem>
          ))}
        </ComboboxList>
        {isSearching && assets.length > 0 ? (
          <p className="sr-only" role="status">
            Updating search results
          </p>
        ) : null}
      </ComboboxContent>
    </Combobox>
  )
}

/** Returns guidance for each empty search state. */
function getEmptyMessage(options: EmptyMessageOptions): string {
  if (!options.query) {
    return 'Search by ticker, company, or token name.'
  }

  if (options.isSearching) {
    return 'Searching Alpaca assets…'
  }

  if (options.hasError) {
    return 'Search is unavailable. Change the query to retry.'
  }

  return 'No matches. Try a ticker such as AAPL or BTC/USD.'
}
