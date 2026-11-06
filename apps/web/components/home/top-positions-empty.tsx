import { ChartPie } from 'lucide-react'

interface Props {
  filtered: boolean
}

/** Explains an empty positions list, separating "none" from "none match". */
export function TopPositionsEmpty({ filtered }: Props) {
  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <ChartPie aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">
        {filtered ? 'No positions in this class' : 'No open positions yet'}
      </p>
      <p className="text-muted-foreground">
        {filtered
          ? 'Switch the filter to see the rest of your holdings.'
          : 'Assets you buy will show up here, ranked by value.'}
      </p>
    </div>
  )
}
