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
import { z } from 'zod'

import {
  getOrderPagesQueryKey,
  getOrdersAndPositionsQueryKey,
} from '@/lib/alpaca/query-keys'
import type {
  AccountOrder,
  GetOrdersOptions,
  OrdersAndPositions,
} from '@/lib/alpaca/schemas'
import {
  accountOrderSchema,
  ordersAndPositionsSchema,
} from '@/lib/alpaca/schemas'
import { parseApiJson } from '@/lib/api/error'
import { getApiUrl } from '@/lib/utils'

interface UseOrderPagesOptions {
  limit: NonNullable<GetOrdersOptions['limit']>
  status?: GetOrdersOptions['status']
}

interface UseOrdersAndPositionsOptions {
  ordersOnly?: boolean
  beforeOrderId?: GetOrdersOptions['beforeOrderId']
  direction?: GetOrdersOptions['direction']
  limit?: GetOrdersOptions['limit']
  nested?: GetOrdersOptions['nested']
  status?: GetOrdersOptions['status']
  symbols?: GetOrdersOptions['symbols']
}

type OrderPage = { orders: AccountOrder[] }

const orderPageSchema = z.object({ orders: z.array(accountOrderSchema) })

/** Fetches orders without positions. */
async function fetchOrdersAndPositions(
  options: UseOrdersAndPositionsOptions & { ordersOnly: true }
): Promise<OrderPage>
/** Fetches orders and positions. */
async function fetchOrdersAndPositions(
  options: UseOrdersAndPositionsOptions
): Promise<OrdersAndPositions>

/** Fetches crypto and equity orders together with all open positions. */
async function fetchOrdersAndPositions(
  options: UseOrdersAndPositionsOptions
): Promise<OrdersAndPositions | OrderPage> {
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
  const endpoint = options.ordersOnly
    ? '/api/alpaca/orders/history'
    : '/api/alpaca/orders'
  const path = search ? `${endpoint}?${search}` : endpoint
  const response = await fetch(getApiUrl(path), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  return parseApiJson(
    response,
    options.ordersOnly ? orderPageSchema : ordersAndPositionsSchema,
    options.ordersOnly
      ? 'Unable to retrieve orders.'
      : 'Unable to retrieve orders and positions.'
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

/**
 * Suspends while loading the newest orders, then loads older pages on demand.
 * A full page means there may be more, so the next page starts before its
 * last order.
 */
export function useOrderPages(
  options: UseOrderPagesOptions
): UseSuspenseInfiniteQueryResult<
  InfiniteData<OrderPage, string | undefined>,
  Error
> {
  return useSuspenseInfiniteQuery({
    getNextPageParam: (page: OrderPage) =>
      page.orders.length === options.limit ? page.orders.at(-1)?.id : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchOrdersAndPositions({
        ordersOnly: true,
        beforeOrderId: pageParam,
        direction: 'desc',
        limit: options.limit,
        status: options.status,
      }),
    queryKey: getOrderPagesQueryKey(options),
    refetchInterval: (query) =>
      (query.state.data?.pages.length ?? 0) > 1 ? false : 30_000,
  })
}
