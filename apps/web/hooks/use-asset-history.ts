import {
  keepPreviousData,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query'

import { AssetDataError } from '@/lib/alpaca/errors'
import { getAssetHistoryQueryKey } from '@/lib/alpaca/query-keys'
import type { AssetHistory, AssetInterval } from '@/lib/alpaca/schemas'
import { assetHistorySchema } from '@/lib/alpaca/schemas'
import { getApiUrl } from '@/lib/utils'

interface FetchAssetHistoryOptions {
  identifier: string
  interval: AssetInterval
  signal: AbortSignal
}

interface UseAssetHistoryOptions {
  identifier: string
  interval: AssetInterval
}

/** Fetches and validates one bounded range of OHLC asset history. */
async function fetchAssetHistory(
  options: FetchAssetHistoryOptions
): Promise<AssetHistory> {
  const query = new URLSearchParams({
    identifier: options.identifier,
    interval: options.interval,
  })
  const response = await fetch(
    getApiUrl(`/api/alpaca/assets/history?${query}`),
    {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    }
  )

  if (!response.ok) {
    throw new AssetDataError(
      response.status === 404
        ? 'Price history is unavailable for this asset.'
        : 'Unable to retrieve price history.',
      response.status
    )
  }

  return assetHistorySchema.parse(await response.json())
}

/** Refetches the selected asset interval every minute while retaining its previous range. */
export function useAssetHistory(
  options: UseAssetHistoryOptions
): UseQueryResult<AssetHistory, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchAssetHistory({ ...options, signal }),
    queryKey: getAssetHistoryQueryKey(options.identifier, options.interval),
    refetchInterval: 60_000,
  })
}
