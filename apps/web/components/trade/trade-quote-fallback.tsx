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
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-y py-4 sm:grid-cols-4">
        {labels.map((label) => (
          <div className="flex flex-col gap-0.5" key={label}>
            <dt className="text-muted-foreground/50">{label}</dt>
            <dd>
              <Skeleton className="h-6 w-20 rounded-md" />
            </dd>
          </div>
        ))}
      </dl>
      <span className="sr-only">Loading quote</span>
    </div>
  )
}
