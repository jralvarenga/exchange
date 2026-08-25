import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { Button } from '@workspace/ui/components/button'
import { SearchIcon } from 'lucide-react'
import { Suspense } from 'react'

import { AccountSummary } from '@/components/balance/account-summary'
import { AccountSummaryFallback } from '@/components/balance/account-summary-fallback'
import { BalanceCard } from '@/components/balance/balance-card'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { TopPositions } from '@/components/portfolio/top-positions'
import { TopPositionsFallback } from '@/components/portfolio/top-positions-fallback'
import {
  getBalanceChange,
  getBalanceChart,
  getCurrentBalance,
  getPortfolio,
} from '@/lib/alpaca/client'
import {
  balanceQueryKey,
  getBalanceChangeQueryKey,
  getBalanceHistoryQueryKey,
  initialBalanceInterval,
  portfolioQueryKey,
} from '@/lib/alpaca/query-keys'

export default async function Page() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.query({
      queryFn: () => getCurrentBalance(),
      queryKey: balanceQueryKey,
    }),
    queryClient.query({
      queryFn: () => getBalanceChange({ interval: initialBalanceInterval }),
      queryKey: getBalanceChangeQueryKey(initialBalanceInterval),
    }),
    queryClient.query({
      queryFn: () => getBalanceChart({ interval: initialBalanceInterval }),
      queryKey: getBalanceHistoryQueryKey(initialBalanceInterval),
    }),
    queryClient.query({
      queryFn: () => getPortfolio(),
      queryKey: portfolioQueryKey,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-4">
        <BalanceCard />
        <BalanceErrorBoundary
          fallback={
            <p className="rounded-2xl bg-primary p-5 font-medium text-primary-foreground">
              Account summary unavailable
            </p>
          }
        >
          <Suspense fallback={<AccountSummaryFallback />}>
            <AccountSummary />
          </Suspense>
        </BalanceErrorBoundary>

        <div>
          <Button
            className="flex w-full flex-row items-center justify-start rounded-2xl bg-input px-4 py-7 text-muted-foreground"
            variant="ghost"
          >
            <SearchIcon className="size-4" />
            <span className="font-bold text-sm">Search by symbols or name</span>
          </Button>
        </div>
        <BalanceErrorBoundary
          fallback={
            <p className="mt-3 rounded-3xl bg-card p-5 text-muted-foreground ring-1 ring-foreground/5">
              Top positions unavailable
            </p>
          }
        >
          <Suspense fallback={<TopPositionsFallback />}>
            <TopPositions />
          </Suspense>
        </BalanceErrorBoundary>
      </div>
    </HydrationBoundary>
  )
}
