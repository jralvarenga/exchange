import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { getMarketCalendarQueryKey } from '@/lib/alpaca/query-keys'
import { type CalendarDay, calendarSchema } from '@/lib/alpaca/trading-schemas'
import { requestJson, withQuery } from '@/lib/api/request'

interface UseMarketCalendarOptions {
  end: string
  start: string
}

/** Loads market trading days in a date range. */
export function useMarketCalendar(
  options: UseMarketCalendarOptions
): UseQueryResult<CalendarDay[], Error> {
  return useQuery({
    queryFn: ({ signal }) =>
      requestJson({
        fallback: 'Unable to load the market calendar.',
        path: withQuery('/api/alpaca/market/calendar', {
          end: options.end,
          start: options.start,
        }),
        schema: calendarSchema,
        signal,
      }),
    queryKey: getMarketCalendarQueryKey(options.start, options.end),
  })
}
