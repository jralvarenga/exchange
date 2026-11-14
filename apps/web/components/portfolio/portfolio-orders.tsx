'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { PortfolioOrdersList } from '@/components/portfolio/portfolio-orders-list'
import { PortfolioSearch } from '@/components/portfolio/portfolio-search'
import { PortfolioTabPanel } from '@/components/portfolio/portfolio-tab-panel'
import { PortfolioToolbar } from '@/components/portfolio/portfolio-toolbar'
import { SectionUnavailable } from '@/components/section-unavailable'
import { ordersAndPositionsQueryKey } from '@/lib/alpaca/query-keys'
import type { OrderStatusFilter } from '@/lib/orders/status'

const statusOptions: PillOption<OrderStatusFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
  { label: 'Closed', value: 'closed' },
]

/** Lists every order, newest first, with a status filter, search and inline cancel. */
export function PortfolioOrders() {
  const [filter, setFilter] = useState<OrderStatusFilter>('all')
  const [query, setQuery] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const queryClient = useQueryClient()

  /** Clears a failed orders query so the tab can load again. */
  async function retryOrders(): Promise<void> {
    await queryClient.resetQueries({ queryKey: ordersAndPositionsQueryKey })
    setRetryKey((key) => key + 1)
  }

  return (
    <PortfolioTabPanel>
      <PortfolioToolbar>
        <PillGroup
          label="Order status"
          onChange={setFilter}
          options={statusOptions}
          value={filter}
        />
        <PortfolioSearch
          id="portfolio-orders-search"
          label="Search orders"
          onChange={setQuery}
          placeholder="Search symbol"
          value={query}
        />
      </PortfolioToolbar>
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
          <PortfolioOrdersList filter={filter} query={query} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </PortfolioTabPanel>
  )
}
