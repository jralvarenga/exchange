import { Skeleton } from '@workspace/ui/components/skeleton'

interface Props {
  label: string
}

const rows = ['row-one', 'row-two', 'row-three', 'row-four', 'row-five']

/** Mirrors an asset list row by row: logo, two text lines, two figures. */
export function AssetListFallback({ label }: Props) {
  return (
    <div role="status">
      <ul aria-hidden="true" className="flex flex-col">
        {rows.map((row, index) => (
          <li
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3"
            key={row}
            style={{ opacity: 1 - index * 0.16 }}
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">{label}</span>
    </div>
  )
}
