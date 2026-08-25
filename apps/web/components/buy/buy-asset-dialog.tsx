'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { SearchIcon } from 'lucide-react'

import { BuyOrderForm } from '@/components/buy/buy-order-form'

export function BuyAssetDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className="flex w-full flex-row items-center justify-start rounded-2xl bg-input px-4 py-7 text-muted-foreground"
            variant="ghost"
          />
        }
      >
        <SearchIcon className="size-4" />
        <span className="font-bold text-sm">Search by symbols or name</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <div className="mt-7 space-y-7">
          <DialogTitle>Place an order</DialogTitle>
          <BuyOrderForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}
