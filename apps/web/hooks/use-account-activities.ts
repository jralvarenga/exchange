import {
  type InfiniteData,
  keepPreviousData,
  type UseQueryResult,
  type UseSuspenseInfiniteQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'

import {
  getAccountActivitiesQueryKey,
  getAccountActivityPagesQueryKey,
} from '@/lib/alpaca/query-keys'
import type {
  AccountActivities,
  GetAccountActivitiesOptions,
} from '@/lib/alpaca/schemas'
import { accountActivitiesSchema } from '@/lib/alpaca/schemas'
import { parseApiJson } from '@/lib/api/error'
import { getApiUrl } from '@/lib/utils'

interface UseAccountActivityPagesOptions {
  category?: GetAccountActivitiesOptions['category']
  pageSize: NonNullable<GetAccountActivitiesOptions['pageSize']>
}

interface UseAccountActivitiesOptions {
  activityTypes?: GetAccountActivitiesOptions['activityTypes']
  after?: GetAccountActivitiesOptions['after']
  category?: GetAccountActivitiesOptions['category']
  date?: GetAccountActivitiesOptions['date']
  direction?: GetAccountActivitiesOptions['direction']
  orderId?: GetAccountActivitiesOptions['orderId']
  pageSize?: GetAccountActivitiesOptions['pageSize']
  pageToken?: GetAccountActivitiesOptions['pageToken']
  until?: GetAccountActivitiesOptions['until']
}

/** Fetches and validates one page of Alpaca account activity. */
async function fetchAccountActivities(
  options: UseAccountActivitiesOptions
): Promise<AccountActivities> {
  const query = new URLSearchParams()

  setSearchParam(
    query,
    'activityTypes',
    options.activityTypes && options.activityTypes.length > 0
      ? options.activityTypes.join(',')
      : undefined
  )
  setSearchParam(query, 'after', options.after)
  setSearchParam(query, 'category', options.category)
  setSearchParam(query, 'date', options.date)
  setSearchParam(query, 'direction', options.direction)
  setSearchParam(query, 'orderId', options.orderId)
  setSearchParam(query, 'pageSize', options.pageSize)
  setSearchParam(query, 'pageToken', options.pageToken)
  setSearchParam(query, 'until', options.until)

  const search = query.toString()
  const path = search
    ? `/api/alpaca/account/activities?${search}`
    : '/api/alpaca/account/activities'
  const response = await fetch(getApiUrl(path), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  return parseApiJson(
    response,
    accountActivitiesSchema,
    'Unable to retrieve account activity.'
  )
}

/** Adds a defined query parameter without serializing undefined values. */
function setSearchParam(
  query: URLSearchParams,
  key: string,
  value?: boolean | number | string
): void {
  if (value !== undefined) {
    query.set(key, String(value))
  }
}

/** Suspends while loading a page of account activity. */
export function useAccountActivities(
  options: UseAccountActivitiesOptions = {}
): UseSuspenseQueryResult<AccountActivities, Error> {
  return useSuspenseQuery({
    queryFn: () => fetchAccountActivities(options),
    queryKey: getAccountActivitiesQueryKey(options),
    refetchInterval: 30_000,
  })
}

/** Loads one page of activity and keeps the previous page visible while the next resolves. */
export function useAccountActivitiesPage(
  options: UseAccountActivitiesOptions = {}
): UseQueryResult<AccountActivities, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchAccountActivities(options),
    queryKey: getAccountActivitiesQueryKey(options),
    refetchInterval: 30_000,
  })
}

/** Suspends while loading the newest activity, then loads older pages on demand. */
export function useAccountActivityPages(
  options: UseAccountActivityPagesOptions
): UseSuspenseInfiniteQueryResult<
  InfiniteData<AccountActivities, string | undefined>,
  Error
> {
  return useSuspenseInfiniteQuery({
    getNextPageParam: (page: AccountActivities) => page.nextPageToken,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchAccountActivities({
        category: options.category,
        direction: 'desc',
        pageSize: options.pageSize,
        pageToken: pageParam,
      }),
    queryKey: getAccountActivityPagesQueryKey(options),
    refetchInterval: 30_000,
  })
}
