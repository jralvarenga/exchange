import { Skeleton } from '@workspace/ui/components/skeleton'

interface Props {
  label: string
}

const rows = ['one', 'two', 'three', 'four', 'five', 'six']

/** Mirrors a Trade tab's text rows, fading out row by row while they load. */
export function TradeRowsFallback({ label }: Props) {
  return (
    <div role="status">
      <ul aria-hidden="true" className="flex flex-col">
        {rows.map((row, index) => (
          <li
            className="flex items-center justify-between gap-4 py-3"
            key={row}
            style={{ opacity: 1 - index * 0.14 }}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/5 rounded-md" />
              <Skeleton className="h-4 w-2/5 rounded-md" />
            </div>
            <Skeleton className="h-5 w-20 rounded-md" />
          </li>
        ))}
      </ul>
      <span className="sr-only">{label}</span>
    </div>
  )
}
