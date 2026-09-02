import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { AssetDataError } from '@/lib/alpaca/errors'
import { getAssetDetailQueryKey } from '@/lib/alpaca/query-keys'
import type { AssetDetail } from '@/lib/alpaca/schemas'
import { assetDetailSchema } from '@/lib/alpaca/schemas'
import { getApiUrl } from '@/lib/utils'

interface FetchAssetDetailOptions {
  identifier: string
  signal: AbortSignal
}

/** Fetches and validates the current summary for one asset. */
async function fetchAssetDetail(
  options: FetchAssetDetailOptions
): Promise<AssetDetail> {
  const query = new URLSearchParams({ identifier: options.identifier })
  const response = await fetch(
    getApiUrl(`/api/alpaca/assets/detail?${query}`),
    {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    }
  )

  if (!response.ok) {
    throw new AssetDataError(
      response.status === 404
        ? 'This asset could not be found.'
        : 'Unable to retrieve this asset.',
      response.status
    )
  }

  return assetDetailSchema.parse(await response.json())
}

/** Keeps one asset's current market and position summary fresh. */
export function useAssetDetail(
  identifier: string
): UseQueryResult<AssetDetail, Error> {
  return useQuery({
    queryFn: ({ signal }) => fetchAssetDetail({ identifier, signal }),
    queryKey: getAssetDetailQueryKey(identifier),
    refetchInterval: 30_000,
  })
}
