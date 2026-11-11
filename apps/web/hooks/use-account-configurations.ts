import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { accountConfigurationsQueryKey } from '@/lib/alpaca/query-keys'
import {
  type AccountConfigurations,
  accountConfigurationsSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

interface QueryToggleOptions {
  enabled?: boolean
}

/** Loads the active account's trading configuration. */
export function useAccountConfigurations(
  options: QueryToggleOptions = {}
): UseQueryResult<AccountConfigurations, Error> {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load account settings.',
        path: '/api/alpaca/account/configurations',
        schema: accountConfigurationsSchema,
        signal,
      }),
    queryKey: accountConfigurationsQueryKey,
  })
}
