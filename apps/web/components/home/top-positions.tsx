'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { TopPositionsList } from '@/components/home/top-positions-list'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { portfolioQueryKey } from '@/lib/alpaca/query-keys'
import type { PositionClassFilter } from '@/lib/portfolio/position-filter'

const classOptions: PillOption<PositionClassFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Stocks', value: 'us_equity' },
  { label: 'Crypto', value: 'crypto' },
]

/** Ranks the largest holdings with an asset-class filter. */
export function TopPositions() {
  const [filter, setFilter] = useState<PositionClassFilter>('all')
  const [retryKey, setRetryKey] = useState(0)
  const queryClient = useQueryClient()

  /** Clears a failed positions query so the section can load again. */
  async function retryPositions(): Promise<void> {
    await queryClient.resetQueries({ queryKey: portfolioQueryKey })
    setRetryKey((key) => key + 1)
  }

  return (
    <Section titleId="top-positions-title">
      <SectionHeader
        href="/portfolio"
        id="top-positions-title"
        title="Top positions"
      >
        <PillGroup
          label="Asset class"
          onChange={setFilter}
          options={classOptions}
          value={filter}
        />
      </SectionHeader>
      <BalanceErrorBoundary
        fallback={
          <SectionUnavailable
            label="Positions unavailable."
            onRetry={retryPositions}
          />
        }
        resetKey={`${filter}:${String(retryKey)}`}
      >
        <ClientSuspense
          fallback={<AssetListFallback label="Loading positions" />}
        >
          <TopPositionsList filter={filter} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </Section>
  )
}
