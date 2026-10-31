import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { accountOverviewQueryKey } from '@/lib/alpaca/query-keys'
import {
  type AccountOverview,
  accountOverviewSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

interface QueryToggleOptions {
  enabled?: boolean
}

/** Keeps balances, margin, and restrictions for the active account fresh. */
export function useAccountOverview(
  options: QueryToggleOptions = {}
): UseQueryResult<AccountOverview, Error> {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the account.',
        path: '/api/alpaca/account/overview',
        schema: accountOverviewSchema,
        signal,
      }),
    queryKey: accountOverviewQueryKey,
    refetchInterval: 30_000,
  })
}
