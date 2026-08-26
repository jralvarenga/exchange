import {
  keepPreviousData,
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'

import { getOrdersAndPositionsQueryKey } from '@/lib/alpaca/query-keys'
import type { GetOrdersOptions, OrdersAndPositions } from '@/lib/alpaca/schemas'
import { ordersAndPositionsSchema } from '@/lib/alpaca/schemas'
import { getApiUrl } from '@/lib/utils'

interface UseOrdersAndPositionsOptions {
  beforeOrderId?: GetOrdersOptions['beforeOrderId']
  direction?: GetOrdersOptions['direction']
  limit?: GetOrdersOptions['limit']
  nested?: GetOrdersOptions['nested']
  status?: GetOrdersOptions['status']
  symbols?: GetOrdersOptions['symbols']
}

/** Fetches crypto and equity orders together with all open positions. */
async function fetchOrdersAndPositions(
  options: UseOrdersAndPositionsOptions
): Promise<OrdersAndPositions> {
  const query = new URLSearchParams()

  setSearchParam(query, 'beforeOrderId', options.beforeOrderId)
  setSearchParam(query, 'direction', options.direction)
  setSearchParam(query, 'limit', options.limit)
  setSearchParam(query, 'nested', options.nested)
  setSearchParam(query, 'status', options.status)
  setSearchParam(
    query,
    'symbols',
    options.symbols && options.symbols.length > 0
      ? options.symbols.join(',')
      : undefined
  )

  const search = query.toString()
  const path = search ? `/api/alpaca/orders?${search}` : '/api/alpaca/orders'
  const response = await fetch(getApiUrl(path), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve orders and positions.')
  }

  return ordersAndPositionsSchema.parse(await response.json())
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

/** Suspends while loading account orders and positions. */
export function useOrdersAndPositions(
  options: UseOrdersAndPositionsOptions = {}
): UseSuspenseQueryResult<OrdersAndPositions, Error> {
  return useSuspenseQuery({
    queryFn: () => fetchOrdersAndPositions(options),
    queryKey: getOrdersAndPositionsQueryKey(options),
    refetchInterval: 30_000,
  })
}

/** Loads one page of orders and keeps the previous page visible while the next resolves. */
export function useOrdersPage(
  options: UseOrdersAndPositionsOptions = {}
): UseQueryResult<OrdersAndPositions, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchOrdersAndPositions(options),
    queryKey: getOrdersAndPositionsQueryKey(options),
    refetchInterval: 30_000,
  })
}
