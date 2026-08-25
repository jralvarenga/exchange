import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'

import { BalanceCard } from '@/components/balance/balance-card'
import { getBalanceChange, getCurrentBalance } from '@/lib/alpaca/client'
import {
  balanceQueryKey,
  getBalanceChangeQueryKey,
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
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-2">
        <BalanceCard />
      </div>
    </HydrationBoundary>
  )
}
