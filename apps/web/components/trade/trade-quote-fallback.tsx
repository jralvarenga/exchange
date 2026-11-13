import { Skeleton } from '@workspace/ui/components/skeleton'

const labels = [
  'Bid',
  'Ask',
  'Last trade',
  'Spread',
  'Open',
  'Day range',
  'Previous close',
  'Volume',
]

/** Keeps the quote labels in place at half opacity while the quote loads. */
export function TradeQuoteFallback() {
  return (
    <div role="status">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 sm:grid-cols-4">
        {labels.map((label) => (
          <div className="flex flex-col gap-1" key={label}>
            <dt className="text-muted-foreground/50">{label}</dt>
            <dd>
              <Skeleton className="h-7 w-24 rounded-md" />
            </dd>
          </div>
        ))}
      </dl>
      <span className="sr-only">Loading quote</span>
    </div>
  )
}
