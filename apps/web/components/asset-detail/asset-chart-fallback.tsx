import { Skeleton } from '@workspace/ui/components/skeleton'

/** Reserves chart height while the selected range loads. */
export function AssetChartFallback() {
  return <Skeleton className="min-h-72 w-full rounded-3xl sm:min-h-80" />
}
