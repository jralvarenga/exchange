import { Skeleton } from '@workspace/ui/components/skeleton'

/** Reserves the balances grid while account figures load. */
export function BalancesFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </div>
  )
}
