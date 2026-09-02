import { ChartNoAxesColumn } from 'lucide-react'

interface Props {
  interval: string
}

/** Explains when Alpaca returns no bars for the selected range. */
export function AssetChartEmpty({ interval }: Props) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl bg-muted/50 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground">
        <ChartNoAxesColumn aria-hidden="true" />
      </span>
      <div>
        <p className="font-medium text-base">No price history yet</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Alpaca returned no bars for {interval}.
        </p>
      </div>
    </div>
  )
}
