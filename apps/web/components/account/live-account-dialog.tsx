'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog'

interface Props {
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

/** Asks before Exchange starts trading with real money on the live account. */
export function LiveAccountDialog({ onConfirm, onOpenChange, open }: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 rounded-[2rem] bg-background p-6 sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle className="font-bold text-xl">
            Switch to the live account?
          </DialogTitle>
          <DialogDescription className="text-base">
            Orders and balances will use real money on your live Alpaca account.
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
            Stay on paper
          </DialogClose>
          <Button
            className="h-11 rounded-full px-5 text-base"
            onClick={onConfirm}
          >
            Use live account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
