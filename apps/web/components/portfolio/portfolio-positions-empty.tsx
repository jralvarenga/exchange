import { ChartPie, SearchX } from 'lucide-react'

interface Props {
  reason: 'filter' | 'none' | 'search'
}

const copy = {
  filter: {
    action: 'Switch the filter to see the rest of your holdings.',
    title: 'No positions in this class',
  },
  none: {
    action: 'Assets you buy will show up here, ranked by value.',
    title: 'No open positions yet',
  },
  search: {
    action: 'Check the symbol or clear the search.',
    title: 'No positions match this search',
  },
}

/** Explains an empty positions tab, separating "none yet" from "none match". */
export function PortfolioPositionsEmpty({ reason }: Props) {
  const Icon = reason === 'search' ? SearchX : ChartPie

  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">{copy[reason].title}</p>
      <p className="text-muted-foreground">{copy[reason].action}</p>
    </div>
  )
}
