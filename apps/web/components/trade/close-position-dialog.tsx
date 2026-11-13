'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { useState } from 'react'

import { formatAssetQuantity } from '@/components/asset-detail/utils'
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

  // Members cannot close positions on a live connection.
  if (!canTrade) {
    return null
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline" />}>
        Close position
      </DialogTrigger>
      <DialogContent className="gap-6 rounded-[2rem] bg-background p-6 sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle className="font-bold text-xl">
            Close your {position.symbol} {position.side} position?
          </DialogTitle>
          <DialogDescription className="text-base">
            A market order will {position.side === 'long' ? 'sell' : 'buy back'}{' '}
            all {quantity} at the best available price. The final price may
            vary.
          </DialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose
            render={
              <Button
                className="h-11 rounded-full px-5 text-base"
                variant="ghost"
              />
            }
          >
            Keep position
          </DialogClose>
          <Button
            className="h-11 rounded-full px-5 text-base"
            disabled={closePosition.isPending}
            onClick={handleConfirm}
            variant="destructive"
          >
            {closePosition.isPending ? 'Closing…' : 'Close position'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
