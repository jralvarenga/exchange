'use client'

import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@workspace/ui/lib/utils'
import { useId, useState } from 'react'

interface Props {
  checked: boolean
  description: string
  disabled?: boolean
  label: string
  onCheckedChange: (checked: boolean) => Promise<void>
}

/** A trading setting that turns on or off and saves as soon as it changes. */
export function TradingSettingSwitch({
  checked,
  description,
  disabled = false,
  label,
  onCheckedChange,
}: Props) {
  const id = useId()
  const [pending, setPending] = useState<boolean>()

  /** Shows the new value right away and saves it, reverting if the save fails. */
  async function handleChange(next: boolean): Promise<void> {
    setPending(next)

    try {
      await onCheckedChange(next)
    } finally {
      setPending(undefined)
    }
  }

  return (
    <li>
      <label
        className={cn(
          '-mx-3 flex min-h-20 items-center justify-between gap-6 rounded-2xl px-3 py-4 transition-colors',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'
        )}
        htmlFor={`${id}-switch`}
      >
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground" id={`${id}-description`}>
            {description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {pending === undefined ? null : (
            <span className="text-muted-foreground" role="status">
              Saving…
            </span>
          )}
          <Switch
            aria-busy={pending !== undefined}
            aria-describedby={`${id}-description`}
            checked={pending ?? checked}
            disabled={disabled}
            id={`${id}-switch`}
            onCheckedChange={(next) => {
              if (pending === undefined) {
                void handleChange(next)
              }
            }}
            readOnly={pending !== undefined}
          />
        </span>
      </label>
    </li>
  )
}
