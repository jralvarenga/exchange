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
import type { ReactElement } from 'react'

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
  /** Optional control that opens the dialog, for confirmations that live in a row. */
  trigger?: ReactElement
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
  trigger,
}: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-2 pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose render={<Button size="xl" variant="ghost" />}>
            {keepLabel}
          </DialogClose>
          <Button
            disabled={busy}
            onClick={onConfirm}
            size="xl"
            variant={tone === 'destructive' ? 'destructive' : 'default'}
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
