'use client'

import { Button } from '@workspace/ui/components/button'
import { ShoppingCart } from 'lucide-react'

import { useOrderTicket } from '@/contexts/order-ticket-context'

interface Props {
  className?: string
}

/**
 * Round icon button that opens the shared ticket on mobile, where the navbar
 * has no room for the labelled Buy / Sell button. Opens on the current
 * screen's asset, if any.
 */
export function TicketFab({ className }: Props) {
  const { openTicket } = useOrderTicket()

  return (
    <Button
      aria-label="Buy or sell"
      className={className}
      size="fab"
      onClick={() => void openTicket()}
      type="button"
    >
      <ShoppingCart aria-hidden="true" />
    </Button>
  )
}
