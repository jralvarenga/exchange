import { Skeleton } from '@workspace/ui/components/skeleton'

interface Props {
  label: string
  rows: string[]
}

/** Mirrors an account fact list with real labels and value-sized blocks. */
export function AccountFactsFallback({ label, rows }: Props) {
  return (
    <div
      className="flex flex-col divide-y divide-border border-border border-y"
      role="status"
    >
      {rows.map((row, index) => (
        <div
          className="flex min-h-16 items-center justify-between gap-4 py-4"
          key={row}
          style={{ opacity: 1 - index * 0.08 }}
        >
          <p aria-hidden="true" className="font-medium text-foreground/50">
            {row}
          </p>
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
