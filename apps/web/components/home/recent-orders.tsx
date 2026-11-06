'use client'

import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { RecentOrdersList } from '@/components/home/recent-orders-list'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { SectionHeader } from '@/components/section-header'
import type { OrderStatusFilter } from '@/lib/orders/status'

const statusOptions: PillOption<OrderStatusFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
  { label: 'Closed', value: 'closed' },
]

/** Shows the latest orders with a status filter and inline cancel. */
export function RecentOrders() {
  const [filter, setFilter] = useState<OrderStatusFilter>('all')

  return (
    <section
      aria-labelledby="recent-orders-title"
      className="flex flex-col gap-4"
    >
      <SectionHeader
        href="/portfolio"
        id="recent-orders-title"
        title="Recent orders"
      >
        <PillGroup
          label="Order status"
          onChange={setFilter}
          options={statusOptions}
          value={filter}
        />
      </SectionHeader>
      <BalanceErrorBoundary
        fallback={
          <p className="py-8 font-medium text-muted-foreground">
            Orders unavailable
          </p>
        }
      >
        <ClientSuspense fallback={<AssetListFallback label="Loading orders" />}>
          <RecentOrdersList filter={filter} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </section>
  )
}
