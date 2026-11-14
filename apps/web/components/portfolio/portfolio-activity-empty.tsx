import { History, SearchX } from 'lucide-react'

interface Props {
  reason: 'filter' | 'none' | 'search'
}

const copy = {
  filter: {
    action: 'Switch the filter to see the rest of your activity.',
    title: 'No activity of this kind',
  },
  none: {
    action: 'Fills, dividends, deposits and fees will show up here.',
    title: 'No activity yet',
  },
  search: {
    action: 'Check the symbol or type, or clear the search.',
    title: 'No activity matches this search',
  },
}

/** Explains an empty activity tab, separating "none yet" from "none match". */
export function PortfolioActivityEmpty({ reason }: Props) {
  const Icon = reason === 'search' ? SearchX : History

  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">{copy[reason].title}</p>
      <p className="text-muted-foreground">{copy[reason].action}</p>
    </div>
  )
}
