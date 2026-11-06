'use client'

import { cn } from '@workspace/ui/lib/utils'

import { RecentOrderRow } from '@/components/home/recent-order-row'
import { RecentOrdersEmpty } from '@/components/home/recent-orders-empty'
import { useOrdersAndPositions } from '@/hooks/use-orders-and-positions'
import type { OrderStatusFilter } from '@/lib/orders/status'
import { getOrderStatus } from '@/lib/orders/status'
import { revealClassName } from '@/lib/utils'

interface Props {
  filter: OrderStatusFilter
}

const visibleOrders = 6

/** Lists the latest orders that match the selected status. */
export function RecentOrdersList({ filter }: Props) {
  const { data } = useOrdersAndPositions({
    direction: 'desc',
    limit: 30,
    status: 'all',
  })
  const orders = data.orders
    .filter(
      (order) =>
        filter === 'all' || getOrderStatus(order.status).tone === filter
    )
    .slice(0, visibleOrders)

  if (orders.length === 0) {
    return <RecentOrdersEmpty filtered={data.orders.length > 0} />
  }

  return (
    <ul className={cn('flex flex-col', revealClassName)}>
      {orders.map((order) => (
        <RecentOrderRow key={order.id} order={order} />
      ))}
    </ul>
  )
}
