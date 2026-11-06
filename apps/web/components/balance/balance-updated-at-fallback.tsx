import { Skeleton } from '@workspace/ui/components/skeleton'

/** Holds one line of timestamp text while the balance loads. */
export function BalanceUpdatedAtFallback() {
  return (
    <p className="flex h-6 items-center" role="status">
      <Skeleton className="h-4 w-60 rounded-full" />
      <span className="sr-only">Loading update time</span>
    </p>
  )
}
