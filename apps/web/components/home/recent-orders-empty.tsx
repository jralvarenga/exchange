import { ReceiptText } from 'lucide-react'

interface Props {
  filtered: boolean
}

/** Explains an empty orders list, separating "none" from "none match". */
export function RecentOrdersEmpty({ filtered }: Props) {
  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <ReceiptText
        aria-hidden="true"
        className="size-6 text-muted-foreground"
      />
      <p className="font-medium">
        {filtered ? 'No recent orders with this status' : 'No orders yet'}
      </p>
      <p className="text-muted-foreground">
        {filtered
          ? 'Switch the filter or view all orders in your portfolio.'
          : 'Orders you place will show up here as they fill.'}
      </p>
    </div>
  )
}
