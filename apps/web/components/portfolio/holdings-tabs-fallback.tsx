import { Skeleton } from '@workspace/ui/components/skeleton'

const tableRows = [
  'holding-one',
  'holding-two',
  'holding-three',
  'holding-four',
  'holding-five',
  'holding-six',
]

/** Reserves the tabs and table area while the holdings request resolves. */
export function HoldingsTabsFallback() {
  return (
    <section
      aria-labelledby="holdings-loading-title"
      className="flex flex-col gap-4"
    >
      <h2 className="sr-only" id="holdings-loading-title">
        Loading assets, orders, and activity
      </h2>
      <Skeleton className="h-11 w-80 rounded-2xl" />
      <div className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/5">
        {tableRows.map((row) => (
          <Skeleton className="h-10 w-full rounded-xl" key={row} />
        ))}
      </div>
    </section>
  )
}
