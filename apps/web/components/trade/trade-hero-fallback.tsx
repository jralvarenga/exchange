import { Skeleton } from '@workspace/ui/components/skeleton'

/** Mirrors the Trade hero's identity, price, day change, and quote line while it loads. */
export function TradeHeroFallback() {
  return (
    <div className="flex flex-col gap-4 pt-4 md:pt-8" role="status">
      <div aria-hidden="true" className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
      >
        <span className="flex items-baseline gap-2">
          <span className="font-medium text-2xl text-muted-foreground/50 md:text-4xl">
            $
          </span>
          <Skeleton className="h-10 w-44 rounded-xl md:h-14 md:w-64 md:rounded-2xl" />
        </span>
        <Skeleton className="h-6 w-20 rounded-lg md:h-7 md:w-24" />
      </div>
      <div aria-hidden="true" className="flex gap-6">
        <span className="text-muted-foreground/50">Bid</span>
        <span className="text-muted-foreground/50">Ask</span>
      </div>
      <span className="sr-only">Loading asset</span>
    </div>
  )
}
