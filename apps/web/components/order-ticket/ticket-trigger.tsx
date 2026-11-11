'use client'

import { Button } from '@workspace/ui/components/button'
import { ArrowLeftRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { useOrderTicket } from '@/contexts/order-ticket-context'
import { getActiveAssetIdentifier } from '@/lib/navigation'
import type { OpenTicketOptions } from '@/models/order-ticket/ticket'

interface Props extends OpenTicketOptions {
  label?: string
}

/** Opens the shared ticket from any screen, retaining the active symbol and side. */
export function TicketTrigger({
  asset,
  assetIdentifier,
  label = 'Buy / Sell',
  side,
}: Props) {
  const { openTicket } = useOrderTicket()
  const pathname = usePathname()
  return (
    <Button
      onClick={() =>
        void openTicket({
          asset,
          assetIdentifier:
            assetIdentifier ?? getActiveAssetIdentifier(pathname),
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
