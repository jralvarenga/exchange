'use client'

import { Button } from '@workspace/ui/components/button'
import { ArrowLeftRight } from 'lucide-react'

import { useOrderTicket } from '@/contexts/order-ticket-context'
import type { OpenTicketOptions } from '@/models/order-ticket/ticket'

interface Props extends OpenTicketOptions {
  label?: string
}

/**
 * Opens the shared ticket from any screen, retaining the active symbol and side.
 * With no asset given, the ticket opens on the current screen's asset, if any.
 */
export function TicketTrigger({
  asset,
  assetIdentifier,
  label = 'Buy / Sell',
  side,
}: Props) {
  const { openTicket } = useOrderTicket()

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
