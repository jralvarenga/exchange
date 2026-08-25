import type { UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { portfolioQueryKey } from '@/lib/alpaca/query-keys'
import type { Portfolio } from '@/lib/alpaca/schemas'
import { portfolioSchema } from '@/lib/alpaca/schemas'

/** Fetches and validates all current Alpaca portfolio positions. */
async function fetchPortfolio(): Promise<Portfolio> {
  const response = await fetch('/api/alpaca/portfolio', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve the portfolio.')
  }

  return portfolioSchema.parse(await response.json())
}

/** Suspends while loading the portfolio and refreshes it every 30 seconds. */
export function usePortfolio(): UseSuspenseQueryResult<Portfolio, Error> {
  return useSuspenseQuery({
    queryFn: fetchPortfolio,
    queryKey: portfolioQueryKey,
    refetchInterval: 30_000,
  })
}
