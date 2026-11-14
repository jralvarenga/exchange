'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { RecentOrdersList } from '@/components/home/recent-orders-list'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { ordersAndPositionsQueryKey } from '@/lib/alpaca/query-keys'
import type { OrderStatusFilter } from '@/lib/orders/status'
import { getPortfolioTabHref } from '@/lib/portfolio/tabs'

const statusOptions: PillOption<OrderStatusFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
  { label: 'Closed', value: 'closed' },
]

/** Shows the latest orders with a status filter and inline cancel. */
export function RecentOrders() {
  const [filter, setFilter] = useState<OrderStatusFilter>('all')
  const [retryKey, setRetryKey] = useState(0)
  const queryClient = useQueryClient()

  /** Clears a failed orders query so the section can load again. */
  async function retryOrders(): Promise<void> {
    await queryClient.resetQueries({ queryKey: ordersAndPositionsQueryKey })
    setRetryKey((key) => key + 1)
  }

  return (
    <Section titleId="recent-orders-title">
      <SectionHeader
        href={getPortfolioTabHref('orders')}
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
          <SectionUnavailable
            label="Orders unavailable."
            onRetry={retryOrders}
          />
        }
        resetKey={`${filter}:${String(retryKey)}`}
      >
        <ClientSuspense fallback={<AssetListFallback label="Loading orders" />}>
          <RecentOrdersList filter={filter} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </Section>
  )
}
