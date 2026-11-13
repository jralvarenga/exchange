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
import { X } from 'lucide-react'
import { useState } from 'react'

import { useCancelOrder } from '@/hooks/use-cancel-order'
import type { AccountOrder } from '@/lib/alpaca/schemas'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface Props {
  order: AccountOrder
}

/** Asks before canceling one open order, then reports the outcome. */
export function CancelOrderDialog({ order }: Props) {
  const [open, setOpen] = useState(false)
  const cancelOrder = useCancelOrder()
  const side = order.side === 'buy' ? 'buy' : 'sell'

  /** Cancels the order and closes the dialog once Alpaca accepts it. */
  async function handleConfirm(): Promise<void> {
    try {
      await cancelOrder.mutateAsync(order.id)
      setOpen(false)
      showSuccessToast({
        description: `${order.symbol} ${side} order canceled.`,
        title: 'Order canceled',
      })
    } catch (error) {
      showErrorToast({
        description:
          error instanceof Error
            ? error.message
            : 'Unable to cancel the order.',
        title: 'Not canceled',
      })
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={`Cancel ${order.symbol} ${side} order`}
            className="relative z-10"
            size="icon"
            variant="ghost"
          />
        }
      >
        <X aria-hidden="true" className="size-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle>
            Cancel {order.symbol} {side} order?
          </DialogTitle>
          <DialogDescription>
            Any part that has not filled yet will be withdrawn. Filled shares
            stay in your portfolio.
          </DialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose render={<Button variant="ghost" />}>
            Keep order
          </DialogClose>
          <Button
            disabled={cancelOrder.isPending}
            onClick={handleConfirm}
            variant="destructive"
          >
            {cancelOrder.isPending ? 'Canceling…' : 'Cancel order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
