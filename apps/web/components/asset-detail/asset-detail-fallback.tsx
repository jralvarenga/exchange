import { Skeleton } from '@workspace/ui/components/skeleton'

/** Reserves the full asset workspace while the initial summary loads. */
export function AssetDetailFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-64 flex-col justify-between rounded-4xl bg-card p-6 shadow-md ring-1 ring-foreground/5">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-56 rounded-2xl" />
            <Skeleton className="h-6 w-44 rounded-xl" />
          </div>
        </div>
        <Skeleton className="min-h-64 rounded-4xl" />
      </div>
      <Skeleton className="min-h-96 flex-1 rounded-4xl" />
    </div>
  )
}
