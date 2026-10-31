import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { getCorporateActionsQueryKey } from '@/lib/alpaca/query-keys'
import {
  type CorporateAction,
  corporateActionsSchema,
} from '@/lib/alpaca/trading-schemas'
import { requestJson, withQuery } from '@/lib/api/request'

/** Loads recent corporate action announcements, optionally for one symbol. */
export function useCorporateActions(
  symbol?: string
): UseQueryResult<CorporateAction[], Error> {
  return useQuery({
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load corporate actions.',
        path: withQuery('/api/alpaca/corporate-actions', { symbol }),
        schema: corporateActionsSchema,
        signal,
      }),
    queryKey: getCorporateActionsQueryKey(symbol),
  })
}
