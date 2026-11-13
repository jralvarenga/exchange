'use client'

import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

import { formatAssetQuantity } from '@/components/asset-detail/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { useClosePosition } from '@/hooks/use-close-position'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface Props {
  position: PortfolioPosition
}

/** Asks before closing a whole position with a market order, then reports the outcome. */
export function ClosePositionDialog({ position }: Props) {
  const [open, setOpen] = useState(false)
  const closePosition = useClosePosition()
  const quantity = formatAssetQuantity(Math.abs(position.quantity))
  const { canTrade } = useOrderTicket()

  /** Closes the position and dismisses the dialog once Alpaca accepts the order. */
  async function handleConfirm(): Promise<void> {
    try {
      await closePosition.mutateAsync({ symbol: position.symbol })
      setOpen(false)
      showSuccessToast({
        description: `Market order sent to close ${quantity} ${position.symbol}.`,
        title: 'Position closing',
      })
    } catch (error) {
      showErrorToast({
        description:
          error instanceof Error
            ? error.message
            : 'Unable to close the position.',
        title: 'Not closed',
      })
    }
  }

  // Viewers, and paper members on live, cannot close positions.
  if (!canTrade) {
    return null
  }

  return (
    <ConfirmDialog
      busy={closePosition.isPending}
      busyLabel="Closing…"
      confirmLabel="Close position"
      description={`A market order will ${position.side === 'long' ? 'sell' : 'buy back'} all ${quantity} at the best available price. The final price may vary.`}
      keepLabel="Keep position"
      onConfirm={() => {
        void handleConfirm()
      }}
      onOpenChange={setOpen}
      open={open}
      title={`Close your ${position.symbol} ${position.side} position?`}
      tone="destructive"
      trigger={<Button variant="outline">Close position</Button>}
    />
  )
}
