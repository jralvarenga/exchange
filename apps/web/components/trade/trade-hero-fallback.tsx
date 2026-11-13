import { Skeleton } from '@workspace/ui/components/skeleton'

/** Mirrors the Trade hero's identity, price, change, and quote line while it loads. */
export function TradeHeroFallback() {
  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-12" role="status">
      <div aria-hidden="true" className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div aria-hidden="true" className="flex items-baseline gap-2">
        <span className="font-medium text-3xl text-muted-foreground/50 md:text-5xl">
          $
        </span>
        <Skeleton className="h-11 w-48 rounded-xl md:h-18 md:w-80 md:rounded-2xl" />
      </div>
      <div aria-hidden="true" className="flex gap-8">
        <span className="text-muted-foreground/50">Bid</span>
        <span className="text-muted-foreground/50">Ask</span>
      </div>
      <span className="sr-only">Loading asset</span>
    </div>
  )
}
