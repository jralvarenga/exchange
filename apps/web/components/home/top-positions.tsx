'use client'

import { useState } from 'react'

import { AssetListFallback } from '@/components/asset-list-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'
import { TopPositionsList } from '@/components/home/top-positions-list'
import { PillGroup, type PillOption } from '@/components/pill-group'
import { SectionHeader } from '@/components/section-header'
import type { PositionClassFilter } from '@/lib/portfolio/position-filter'

const classOptions: PillOption<PositionClassFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Stocks', value: 'us_equity' },
  { label: 'Crypto', value: 'crypto' },
]

/** Ranks the largest holdings with an asset-class filter. */
export function TopPositions() {
  const [filter, setFilter] = useState<PositionClassFilter>('all')

  return (
    <section
      aria-labelledby="top-positions-title"
      className="flex flex-col gap-4"
    >
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
          <p className="py-8 font-medium text-muted-foreground">
            Positions unavailable
          </p>
        }
      >
        <ClientSuspense
          fallback={<AssetListFallback label="Loading positions" />}
        >
          <TopPositionsList filter={filter} />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </section>
  )
}
