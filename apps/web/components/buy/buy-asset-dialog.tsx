'use client'

import { buttonVariants } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { useToastManager } from '@workspace/ui/components/toast'
import { cn } from '@workspace/ui/lib/utils'
import { DollarSign, SearchIcon } from 'lucide-react'
import { useState } from 'react'

import { BuyOrderForm } from '@/components/buy/buy-order-form'
import type { Order } from '@/lib/alpaca/schemas'

/** Opens the order ticket and reports successful submissions with a toast. */
export function BuyAssetDialog() {
  const [open, setOpen] = useState(false)
  const toastManager = useToastManager()

  function handleOrderSubmitted(order: Order): void {
    setOpen(false)
    toastManager.add({
      description: `Alpaca received the order for ${order.symbol}.`,
      timeout: 4000,
      title: `${order.side === 'buy' ? 'Buy' : 'Sell'} order submitted`,
      type: 'success',
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'default' }),
        )}
      >
        <DollarSign className="size-4" />
        <span className="font-bold text-sm">Buy or sell asset</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <div className="space-y-5">
          <DialogTitle>Place an order</DialogTitle>
          <BuyOrderForm onOrderSubmitted={handleOrderSubmitted} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
