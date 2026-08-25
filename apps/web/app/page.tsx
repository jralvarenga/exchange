import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'

import { BalanceCard } from '@/components/balance/balance-card'
import {
  getBalanceChange,
  getBalanceChart,
  getCurrentBalance,
} from '@/lib/alpaca/client'
import {
  balanceQueryKey,
  getBalanceChangeQueryKey,
  getBalanceHistoryQueryKey,
  initialBalanceInterval,
} from '@/lib/alpaca/query-keys'

export default async function Page() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.fetchQuery({
      queryFn: () => getCurrentBalance(),
      queryKey: balanceQueryKey,
    }),
    queryClient.fetchQuery({
      queryFn: () => getBalanceChange({ interval: initialBalanceInterval }),
      queryKey: getBalanceChangeQueryKey(initialBalanceInterval),
    }),
    queryClient.fetchQuery({
      queryFn: () => getBalanceChart({ interval: initialBalanceInterval }),
      queryKey: getBalanceHistoryQueryKey(initialBalanceInterval),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-2">
        <BalanceCard />
      </div>
    </HydrationBoundary>
  )
}
