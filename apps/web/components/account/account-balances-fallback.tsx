import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'

const stats = [
  { label: 'Equity', width: 'w-44' },
  { label: 'Cash', width: 'w-40' },
  { label: 'Long value', width: 'w-40' },
  { label: 'Short value', width: 'w-28' },
]

/** Mirrors the balances strip with real labels and value-sized blocks. */
export function AccountBalancesFallback() {
  return (
    <div
      className="grid grid-cols-1 divide-y divide-border border-border border-y lg:grid-cols-4 lg:divide-x lg:divide-y-0"
      role="status"
    >
      {stats.map((stat) => (
        <div
          className="flex flex-col gap-2 py-6 lg:px-8 lg:last-of-type:pr-0 lg:first:pl-0"
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
