import { Skeleton } from '@workspace/ui/components/skeleton'

const fallbackRows = [
  'table-row-one',
  'table-row-two',
  'table-row-three',
  'table-row-four',
  'table-row-five',
  'table-row-six',
]

/** Reserves table space while a paginated orders or activity page loads. */
export function DataTableFallback() {
  return (
    <div className="flex flex-col gap-3 p-5">
      {fallbackRows.map((row) => (
        <Skeleton className="h-10 w-full rounded-xl" key={row} />
      ))}
    </div>
  )
}
