import type { UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { getBalanceChangeQueryKey } from '@/lib/alpaca/query-keys'
import type { BalanceChange, BalanceInterval } from '@/lib/alpaca/schemas'
import { balanceChangeSchema } from '@/lib/alpaca/schemas'

interface UseBalanceChangeOptions {
  interval: BalanceInterval
}

/** Fetches and validates the balance change for one interval. */
async function fetchBalanceChange(
  options: UseBalanceChangeOptions
): Promise<BalanceChange> {
  const query = new URLSearchParams({ interval: options.interval })
  const response = await fetch(`/api/alpaca/balance/change?${query}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve the balance change.')
  }

  return balanceChangeSchema.parse(await response.json())
}

/** Suspends while loading the selected interval's balance change. */
export function useBalanceChange(
  options: UseBalanceChangeOptions
): UseSuspenseQueryResult<BalanceChange, Error> {
  return useSuspenseQuery({
    queryFn: () => fetchBalanceChange(options),
    queryKey: getBalanceChangeQueryKey(options.interval),
    refetchInterval: 30_000,
  })
}
