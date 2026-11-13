'use client'

import { Button } from '@workspace/ui/components/button'
import { X } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
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
    <ConfirmDialog
      busy={cancelOrder.isPending}
      busyLabel="Canceling…"
      confirmLabel="Cancel order"
      description="Any part that has not filled yet will be withdrawn. Filled shares stay in your portfolio."
      keepLabel="Keep order"
      onConfirm={() => {
        void handleConfirm()
      }}
      onOpenChange={setOpen}
      open={open}
      title={`Cancel ${order.symbol} ${side} order?`}
      tone="destructive"
      trigger={
        <Button
          aria-label={`Cancel ${order.symbol} ${side} order`}
          className="relative z-10"
          size="icon-xl"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      }
    />
  )
}
