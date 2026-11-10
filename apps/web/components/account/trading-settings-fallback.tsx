import { Skeleton } from '@workspace/ui/components/skeleton'

const switchRows = [
  'Pause trading',
  'Short selling',
  'Fractional shares',
  'Trade confirmation emails',
  'Maximum margin',
  'Options level limit',
]

const factRows = ['Day trade buying power', 'Pattern day trader check']

/** Mirrors the trading settings list with real titles and control-sized blocks. */
export function TradingSettingsFallback() {
  return (
    <div
      className="flex flex-col divide-y divide-border border-border border-y"
      role="status"
    >
      {switchRows.map((row, index) => (
        <div
          className="flex min-h-20 items-center justify-between gap-6 py-4"
          key={row}
          style={{ opacity: 1 - index * 0.08 }}
        >
          <div className="flex flex-col gap-2">
            <p aria-hidden="true" className="font-medium text-foreground/50">
              {row}
            </p>
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
      ))}
      {factRows.map((row, index) => (
        <div
          className="flex min-h-20 flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          key={row}
          style={{ opacity: 1 - (switchRows.length + index) * 0.08 }}
        >
          <div className="flex flex-col gap-2">
            <p aria-hidden="true" className="font-medium text-foreground/50">
              {row}
            </p>
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
      ))}
      <span className="sr-only">Loading trading settings</span>
    </div>
  )
}
