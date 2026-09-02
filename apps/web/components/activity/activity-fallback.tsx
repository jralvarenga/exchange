import { Skeleton } from '@workspace/ui/components/skeleton'

const fallbackRows = [
  'activity-row-one',
  'activity-row-two',
  'activity-row-three',
  'activity-row-four',
  'activity-row-five',
]

/** Reserves activity rows while the latest account events load. */
export function ActivityFallback() {
  return (
    <ul className="flex flex-col gap-3">
      {fallbackRows.map((row) => (
        <li className="flex items-center gap-3" key={row}>
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-xl" />
            <Skeleton className="h-3 w-36 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-20 rounded-xl" />
        </li>
      ))}
    </ul>
  )
}
