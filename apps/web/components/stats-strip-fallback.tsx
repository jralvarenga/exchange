import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'

interface Props {
  stats: readonly { label: string; width: string }[]
  loadingLabel: string
}

/** Mirrors a stats strip with labels and value-sized loading blocks. */
export function StatsStripFallback({ stats, loadingLabel }: Props) {
  return (
    <div
      className="grid grid-cols-1 divide-y divide-border border-border border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      role="status"
    >
      {stats.map((stat, index) => (
        <div
          className={cn(
            'flex flex-col gap-2 py-6',
            index === 0
              ? 'sm:pr-8'
              : index === stats.length - 1
                ? 'sm:pl-8'
                : 'sm:px-8'
          )}
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
      <span className="sr-only">{loadingLabel}</span>
    </div>
  )
}
