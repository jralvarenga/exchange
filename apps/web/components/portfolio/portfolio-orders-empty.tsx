import { ReceiptText, SearchX } from 'lucide-react'

interface Props {
  reason: 'filter' | 'none' | 'search'
}

const copy = {
  filter: {
    action: 'Switch the filter to see your other orders.',
    title: 'No orders with this status',
  },
  none: {
    action: 'Orders you place will show up here.',
    title: 'No orders yet',
  },
  search: {
    action: 'Check the symbol or clear the search.',
    title: 'No orders match this search',
  },
}

/** Explains an empty orders tab, separating "none yet" from "none match". */
export function PortfolioOrdersEmpty({ reason }: Props) {
  const Icon = reason === 'search' ? SearchX : ReceiptText

  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <Icon aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">{copy[reason].title}</p>
      <p className="text-muted-foreground">{copy[reason].action}</p>
    </div>
  )
}
