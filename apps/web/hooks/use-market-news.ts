import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { type NewsArticle, newsSchema } from '@/lib/alpaca/market-schemas'
import { getNewsQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

interface UseMarketNewsOptions {
  limit?: number
  symbols?: string[]
}

/** Loads recent news, optionally for specific symbols. */
export function useMarketNews(
  options: UseMarketNewsOptions = {}
): UseQueryResult<NewsArticle[], Error> {
  return useQuery({
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load news.',
        path: withQuery('/api/alpaca/market/news', {
          limit: options.limit,
          symbols: options.symbols?.join(','),
        }),
        schema: newsSchema,
        signal,
      }),
    queryKey: getNewsQueryKey(options.symbols),
    refetchInterval: 300_000,
  })
}
