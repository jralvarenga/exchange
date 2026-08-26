import {
  keepPreviousData,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query'

import { getAssetSearchQueryKey } from '@/lib/alpaca/query-keys'
import type { AssetSearchResponse } from '@/lib/alpaca/schemas'
import { assetSearchResponseSchema } from '@/lib/alpaca/schemas'
import { getApiUrl } from '@/lib/utils'

interface FetchAssetSearchOptions {
  query: string
  signal: AbortSignal
}

/** Requests and validates ranked Alpaca asset search results. */
async function fetchAssetSearch(
  options: FetchAssetSearchOptions
): Promise<AssetSearchResponse> {
  const parameters = new URLSearchParams({ limit: '8', query: options.query })
  const response = await fetch(
    getApiUrl(`/api/alpaca/assets/search?${parameters}`),
    {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    }
  )

  if (!response.ok) {
    throw new Error('Unable to search Alpaca assets.')
  }

  return assetSearchResponseSchema.parse(await response.json())
}

/** Searches Alpaca assets without suspending the active typing interaction. */
export function useAssetSearch(
  query: string
): UseQueryResult<AssetSearchResponse, Error> {
  return useQuery({
    enabled: query.length > 0,
    gcTime: 10 * 60 * 1_000,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchAssetSearch({ query, signal }),
    queryKey: getAssetSearchQueryKey(query),
    staleTime: 5 * 60 * 1_000,
  })
}
