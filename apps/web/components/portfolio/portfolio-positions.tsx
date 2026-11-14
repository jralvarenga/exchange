'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { PortfolioPositionsList } from '@/components/portfolio/portfolio-positions-list'
import { PortfolioPositionsSummary } from '@/components/portfolio/portfolio-positions-summary'
import { PortfolioPositionsSummaryFallback } from '@/components/portfolio/portfolio-positions-summary-fallback'
import { PortfolioSearch } from '@/components/portfolio/portfolio-search'
import { PortfolioTabPanel } from '@/components/portfolio/portfolio-tab-panel'
import { PortfolioToolbar } from '@/components/portfolio/portfolio-toolbar'
import { SectionUnavailable } from '@/components/section-unavailable'
import { portfolioQueryKey } from '@/lib/alpaca/query-keys'
import type { PositionClassFilter } from '@/lib/portfolio/position-filter'

const classOptions: PillOption<PositionClassFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Stocks', value: 'us_equity' },
  { label: 'Crypto', value: 'crypto' },
]

/** Totals every holding, then lists them all with class and symbol filters. */
export function PortfolioPositions() {
  const [filter, setFilter] = useState<PositionClassFilter>('all')
  const [query, setQuery] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const queryClient = useQueryClient()

  /** Clears a failed positions query so the tab can load again. */
  async function retryPositions(): Promise<void> {
    await queryClient.resetQueries({ queryKey: portfolioQueryKey })
    setRetryKey((key) => key + 1)
  }

  return (
    <PortfolioTabPanel>
      <BalanceErrorBoundary
        fallback={
          <SectionUnavailable
            label="Positions unavailable."
            onRetry={retryPositions}
          />
        }
        resetKey={String(retryKey)}
      >
        <ClientSuspense fallback={<PortfolioPositionsSummaryFallback />}>
          <PortfolioPositionsSummary />
        </ClientSuspense>
        <PortfolioToolbar>
          <PillGroup
            label="Asset class"
            onChange={setFilter}
            options={classOptions}
            value={filter}
          />
          <PortfolioSearch
            id="portfolio-positions-search"
            label="Search positions"
            onChange={setQuery}
            placeholder="Search symbol"
            value={query}
          />
        </PortfolioToolbar>
        <ClientSuspense
          fallback={<AssetListFallback label="Loading positions" />}
        >
          <PortfolioPositionsList filter={filter} query={query} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </PortfolioTabPanel>
  )
}
