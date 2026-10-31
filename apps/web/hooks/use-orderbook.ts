import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { type Orderbook, orderbookSchema } from '@/lib/alpaca/market-schemas'
import { getOrderbookQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

interface UseOrderbookOptions {
  enabled: boolean
  symbol: string
}

/** Keeps a crypto pair's order book fresh while it is shown. */
export function useOrderbook(
  options: UseOrderbookOptions
): UseQueryResult<Orderbook, Error> {
  return useQuery({
    enabled: options.enabled,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the order book.',
        path: withQuery('/api/alpaca/market/orderbook', {
          symbol: options.symbol,
        }),
        schema: orderbookSchema,
        signal,
      }),
    queryKey: getOrderbookQueryKey(options.symbol),
    refetchInterval: 5_000,
  })
}
