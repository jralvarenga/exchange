'use client'

import { Button } from '@workspace/ui/components/button'
import { ArrowLeftRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { useOrderTicket } from '@/contexts/order-ticket-context'
import { isTradePath } from '@/lib/navigation'
import type { OpenTicketOptions } from '@/models/order-ticket/ticket'

interface Props extends OpenTicketOptions {
  label?: string
}

/**
 * Opens the shared ticket from any screen, retaining the active symbol and side.
 * Hidden on the Trade screen, where the ticket is already inline.
 */
export function TicketTrigger({
  asset,
  assetIdentifier,
  label = 'Buy / Sell',
  side,
}: Props) {
  const { openTicket } = useOrderTicket()
  const pathname = usePathname()

  if (isTradePath(pathname)) {
    return null
  }

  return (
    <Button
      onClick={() =>
        void openTicket({
          asset,
          assetIdentifier,
          side,
        })
      }
      type="button"
    >
      <ArrowLeftRight aria-hidden="true" />
      {label}
    </Button>
  )
}
