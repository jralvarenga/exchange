import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'

const stats = [
  { className: 'sm:pr-8', label: 'Buying power', width: 'w-48' },
  { className: 'sm:px-8', label: 'Cash', width: 'w-40' },
  { className: 'sm:pl-8', label: 'Today', width: 'w-44' },
]

/** Mirrors the stats strip with real labels and value-sized blocks. */
export function BalancesFallback() {
  return (
    <div
      className="grid grid-cols-1 divide-y divide-border border-border border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      role="status"
    >
      {stats.map((stat) => (
        <div
          className={cn('flex flex-col gap-2 py-6', stat.className)}
          key={stat.label}
        >
          <p
            aria-hidden="true"
            className="font-medium text-muted-foreground/50"
          >
            {stat.label}
          </p>
          <div className="flex h-9 items-center">
            <Skeleton className={cn('h-7 rounded-lg', stat.width)} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading balances</span>
    </div>
  )
}
