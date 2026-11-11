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
  busy: boolean
  environment: 'live' | 'paper'
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

/** Asks before deleting one environment's stored Alpaca keys. */
export function RemoveKeyDialog({
  busy,
  environment,
  onConfirm,
  onOpenChange,
  open,
}: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 rounded-[2rem] bg-background p-6 sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle className="font-bold text-xl">
            Remove your {environment} keys?
          </DialogTitle>
          <DialogDescription className="text-base">
            Exchange stops using the {environment} account until you add keys
            again. Nothing changes in Alpaca.
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
            Keep keys
          </DialogClose>
          <Button
            className="h-11 rounded-full px-5 text-base"
            disabled={busy}
            onClick={onConfirm}
            variant="destructive"
          >
            {busy ? 'Removing…' : 'Remove keys'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
