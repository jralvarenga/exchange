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
  busy?: boolean
  busyLabel?: string
  confirmLabel: string
  description: string
  keepLabel: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  /** Question naming what is about to happen: "Remove Main paper?" */
  title: string
  tone?: 'default' | 'destructive'
}

/** Asks before a consequential action, with a ghost keep pill and a confirm pill. */
export function ConfirmDialog({
  busy = false,
  busyLabel,
  confirmLabel,
  description,
  keepLabel,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = 'default',
}: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 rounded-[2rem] bg-background p-6 sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle className="font-bold text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
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
            {keepLabel}
          </DialogClose>
          <Button
            className="h-11 rounded-full px-5 text-base"
            disabled={busy}
            onClick={onConfirm}
            variant={tone === 'destructive' ? 'destructive' : 'default'}
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
