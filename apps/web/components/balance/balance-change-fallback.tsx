import { Skeleton } from '@workspace/ui/components/skeleton'

/** Mirrors the arrow and percent of the interval change while it loads. */
export function BalanceChangeFallback() {
  return (
    <div className="inline-flex items-center gap-1.5" role="status">
      <Skeleton className="size-5 rounded-full md:size-7" />
      <Skeleton className="h-5 w-20 rounded-lg md:h-7 md:w-28" />
      <span className="sr-only">Loading change</span>
    </div>
  )
}
