import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { HoldingsTabs } from '@/components/portfolio/holdings-tabs'
import { HoldingsTabsFallback } from '@/components/portfolio/holdings-tabs-fallback'
import { PortfolioCard } from '@/components/portfolio/portfolio-card'
import { PortfolioCardFallback } from '@/components/portfolio/portfolio-card-fallback'
import {
  getAccountActivities,
  getOrdersAndPositions,
  getPortfolio,
} from '@/lib/alpaca/client'
import {
  getAccountActivitiesQueryKey,
  getOrdersAndPositionsQueryKey,
  portfolioQueryKey,
} from '@/lib/alpaca/query-keys'
import { TABLE_PAGE_SIZE } from '@/lib/table/pagination'

const firstOrdersPage = {
  beforeOrderId: undefined,
  limit: TABLE_PAGE_SIZE,
}

const firstActivitiesPage = {
  pageSize: TABLE_PAGE_SIZE,
  pageToken: undefined,
}

export const metadata: Metadata = {
  title: 'Portfolio',
}

export default async function Page() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.query({
      queryFn: () => getPortfolio(),
      queryKey: portfolioQueryKey,
    }),
    queryClient.query({
      queryFn: () => getOrdersAndPositions(firstOrdersPage),
      queryKey: getOrdersAndPositionsQueryKey(firstOrdersPage),
    }),
    queryClient.query({
      queryFn: () => getAccountActivities(firstActivitiesPage),
      queryKey: getAccountActivitiesQueryKey(firstActivitiesPage),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <Suspense fallback={<PortfolioCardFallback />}>
          <PortfolioCard />
        </Suspense>
        <Suspense fallback={<HoldingsTabsFallback />}>
          <HoldingsTabs />
        </Suspense>
      </div>
    </HydrationBoundary>
  )
}
