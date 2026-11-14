'use client'

import { cn } from '@workspace/ui/lib/utils'

import { RecentOrderRow } from '@/components/home/recent-order-row'
import { PortfolioOrdersEmpty } from '@/components/portfolio/portfolio-orders-empty'
import { PortfolioShowMore } from '@/components/portfolio/portfolio-show-more'
import { useOrderPages } from '@/hooks/use-orders-and-positions'
import type { OrderStatusFilter } from '@/lib/orders/status'
import { getOrderStatus, getOrdersApiStatus } from '@/lib/orders/status'
import { matchesSymbolQuery } from '@/lib/portfolio/symbol-query'
import { revealClassName } from '@/lib/utils'

interface Props {
  filter: OrderStatusFilter
  query: string
}

const ORDERS_PAGE_SIZE = 25

/** Lists loaded orders that match the status and search, with older pages on demand. */
export function PortfolioOrdersList({ filter, query }: Props) {
  const orderPages = useOrderPages({
    limit: ORDERS_PAGE_SIZE,
    status: getOrdersApiStatus(filter),
  })
  const loadedOrders = orderPages.data.pages.flatMap((page) => page.orders)
  const orders = loadedOrders.filter(
    (order) =>
      (filter === 'all' ||
        filter === 'open' ||
        getOrderStatus(order.status).tone === filter) &&
      matchesSymbolQuery({ query, values: [order.symbol] })
  )

  return (
    <div className="flex flex-col gap-6">
      {orders.length === 0 ? (
        <PortfolioOrdersEmpty
          reason={
            query.trim()
              ? 'search'
              : filter === 'all' && loadedOrders.length === 0
                ? 'none'
                : 'filter'
          }
        />
      ) : (
        <ul className={cn('flex flex-col', revealClassName)}>
          {orders.map((order) => (
            <RecentOrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
      {orderPages.hasNextPage ? (
        <PortfolioShowMore
          label="Show older orders"
          loading={orderPages.isFetchingNextPage}
          onClick={() => void orderPages.fetchNextPage()}
        />
      ) : null}
    </div>
  )
}
