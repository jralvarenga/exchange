import type { UseSuspenseQueryResult } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'

import { balanceQueryKey } from '@/lib/alpaca/query-keys'
import type { CurrentBalance } from '@/lib/alpaca/schemas'
import { currentBalanceSchema } from '@/lib/alpaca/schemas'

/** Fetches and validates the current Alpaca account balance. */
async function fetchBalance(): Promise<CurrentBalance> {
  const response = await fetch('/api/alpaca/balance', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve the current balance.')
  }

  return currentBalanceSchema.parse(await response.json())
}

/** Suspends while loading the balance and refreshes it every 30 seconds. */
export function useBalance(): UseSuspenseQueryResult<CurrentBalance, Error> {
  return useSuspenseQuery({
    queryFn: fetchBalance,
    queryKey: balanceQueryKey,
    refetchInterval: 30_000,
  })
}
