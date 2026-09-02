'use client'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox'
import { cn } from '@workspace/ui/lib/utils'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { AssetIcon } from '@/components/assets/asset-icon'
import { useAssetSearch } from '@/hooks/use-asset-search'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'

interface Props {
  className?: string
  initialSymbol?: string
  onValueChange?: (asset: AssetSearchResult | null) => void
  placeholder?: string
  value?: AssetSearchResult | null
}

interface EmptyMessageOptions {
  hasError: boolean
  isSearching: boolean
  query: string
}

const SEARCH_DELAY_MS = 250
const emptyAssets: AssetSearchResult[] = []

/** Searches Alpaca assets and displays each result with its market icon. */
export function AssetCombobox({
  className,
  initialSymbol,
  onValueChange,
  placeholder = 'Search by symbol…',
  value,
}: Props) {
  const inputId = useId()
  const [internalValue, setInternalValue] = useState<AssetSearchResult | null>(
    null
  )
  const [inputValue, setInputValue] = useState(
    () => initialSymbol?.trim() ?? ''
  )
  const selectedValue = value === undefined ? internalValue : value
  const normalizedInput = inputValue.trim()
  const debouncedQuery = useDebouncedValue(normalizedInput, SEARCH_DELAY_MS)
  const search = useAssetSearch(debouncedQuery)
  const isSearching = normalizedInput !== debouncedQuery || search.isFetching
  const assets =
    search.data?.query === debouncedQuery ? search.data.assets : emptyAssets
  const emptyMessage = getEmptyMessage({
    hasError: search.isError,
    isSearching,
    query: inputValue,
  })

  useEffect(() => {
    if (value) {
      setInputValue(value.symbol)
    }
  }, [value])

  /** Synchronizes internal and external consumers after a selection changes. */
  function handleValueChange(asset: AssetSearchResult | null): void {
    setInternalValue(asset)
    onValueChange?.(asset)

    if (asset) {
      setInputValue(asset.symbol)
    }
  }

  return (
    <Combobox
      autoHighlight
      filter={null}
      inputValue={inputValue}
      isItemEqualToValue={(asset, selectedAsset) =>
        asset.id === selectedAsset.id
      }
      itemToStringLabel={(asset) => asset.symbol}
      items={assets}
      onInputValueChange={(nextInput) => {
        setInputValue(nextInput)

        if (
          selectedValue &&
          nextInput !==
            selectedValue.symbol
        ) {
          handleValueChange(null)
        }
      }}
      onValueChange={handleValueChange}
      value={selectedValue}
    >
      <ComboboxInput
        aria-label="Search assets"
        className={cn('h-12 w-full', className)}
        id={inputId}
        placeholder={placeholder}
        showClear
        showTrigger={false}
      />
      <ComboboxContent
        aria-busy={isSearching}
        className="w-full min-w-(--anchor-width) max-w-(--anchor-width)"
      >
        <ComboboxEmpty>
          <span className="flex items-center gap-2">
            {isSearching ? (
              <LoaderCircle
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
              <AssetIcon assetClass={asset.assetClass} symbol={asset.symbol} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium">{asset.symbol}</span>
                  <span className="text-muted-foreground text-xs">
                    {asset.assetClass === 'crypto' ? 'Crypto' : asset.exchange}
                  </span>
                </span>
                <span className="truncate text-muted-foreground">
                  {asset.name}
                </span>
              </span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

/** Returns guidance for each asynchronous search state. */
function getEmptyMessage(options: EmptyMessageOptions): string {
  if (!options.query.trim()) {
    return 'Search by ticker or asset name.'
  }

  if (options.isSearching) {
    return 'Searching Alpaca assets…'
  }

  if (options.hasError) {
    return 'Asset search is unavailable. Change the query to retry.'
  }

  return 'No matching assets found.'
}
