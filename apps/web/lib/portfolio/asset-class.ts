import type { AssetSearchResult } from '@/lib/alpaca/schemas'

/** Maps an Alpaca asset class to the searchable class used by asset icons. */
export function getSearchableAssetClass(
  assetClass?: string
): AssetSearchResult['assetClass'] {
  if (assetClass === 'crypto') {
    return 'crypto'
  }

  return 'us_equity'
}
