'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { PortfolioActivityList } from '@/components/portfolio/portfolio-activity-list'
import { PortfolioSearch } from '@/components/portfolio/portfolio-search'
import { PortfolioTabPanel } from '@/components/portfolio/portfolio-tab-panel'
import { PortfolioToolbar } from '@/components/portfolio/portfolio-toolbar'
import { SectionUnavailable } from '@/components/section-unavailable'
import type { ActivityCategoryFilter } from '@/lib/activity/category-filter'
import { accountActivitiesQueryKey } from '@/lib/alpaca/query-keys'

const categoryOptions: PillOption<ActivityCategoryFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Trades', value: 'trade_activity' },
  { label: 'Cash and income', value: 'non_trade_activity' },
]

/** Shows fills, dividends, transfers and fees day by day, with a kind filter and search. */
export function PortfolioActivity() {
  const [filter, setFilter] = useState<ActivityCategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const queryClient = useQueryClient()

  /** Clears a failed activity query so the tab can load again. */
  async function retryActivity(): Promise<void> {
    await queryClient.resetQueries({ queryKey: accountActivitiesQueryKey })
    setRetryKey((key) => key + 1)
  }

  return (
    <PortfolioTabPanel>
      <PortfolioToolbar>
        <PillGroup
          label="Activity kind"
          onChange={setFilter}
          options={categoryOptions}
          value={filter}
        />
        <PortfolioSearch
          id="portfolio-activity-search"
          label="Search activity"
          onChange={setQuery}
          placeholder="Search symbol or type"
          value={query}
        />
      </PortfolioToolbar>
      <BalanceErrorBoundary
        fallback={
          <SectionUnavailable
            label="Activity unavailable."
            onRetry={retryActivity}
          />
        }
        resetKey={`${filter}:${String(retryKey)}`}
      >
        <ClientSuspense
          fallback={<AssetListFallback label="Loading activity" />}
        >
          <PortfolioActivityList filter={filter} query={query} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </PortfolioTabPanel>
  )
}
