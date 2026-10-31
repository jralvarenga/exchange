import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import {
  type OptionChain,
  optionChainSchema,
} from '@/lib/alpaca/market-schemas'
import { getOptionChainQueryKey } from '@/lib/alpaca/query-keys'
import { requestJson, withQuery } from '@/lib/api/request'

interface UseOptionChainOptions {
  enabled: boolean
  expiration?: string
  underlying: string
}

/** Loads calls and puts for one underlying and expiration. */
export function useOptionChain(
  options: UseOptionChainOptions
): UseQueryResult<OptionChain, Error> {
  return useQuery({
    enabled: options.enabled && options.underlying.trim().length > 0,
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the option chain.',
        path: withQuery('/api/alpaca/options/chain', {
          expiration: options.expiration,
          underlying: options.underlying,
        }),
        schema: optionChainSchema,
        signal,
      }),
    queryKey: getOptionChainQueryKey(options.underlying, options.expiration),
    refetchInterval: 30_000,
  })
}
