import { Skeleton } from '@workspace/ui/components/skeleton'

/** Mirrors the balance figure's symbol and digit block while it loads. */
export function BalanceValueFallback() {
  return (
    <div className="flex items-baseline gap-2" role="status">
      <span
        aria-hidden="true"
        className="font-medium text-3xl text-muted-foreground/50 md:text-5xl"
      >
        $
      </span>
      <Skeleton className="h-11 w-48 rounded-xl md:h-18 md:w-80 md:rounded-2xl" />
      <span className="sr-only">Loading balance</span>
    </div>
  )
}
