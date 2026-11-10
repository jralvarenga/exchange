'use client'

import { useId, useState } from 'react'

import { PillGroup, type PillOption } from '@/components/pill-group'

interface Props<T extends string> {
  description: string
  label: string
  onChange: (value: T) => Promise<void>
  options: PillOption<T>[]
  value: T
}

/** A trading setting with a few exclusive values that saves on selection. */
export function TradingSettingChoice<T extends string>({
  description,
  label,
  onChange,
  options,
  value,
}: Props<T>) {
  const id = useId()
  const [pending, setPending] = useState<T>()

  /** Shows the picked value right away and saves it, reverting if the save fails. */
  async function handleChange(next: T): Promise<void> {
    if (pending !== undefined || next === value) {
      return
    }

    setPending(next)

    try {
      await onChange(next)
    } finally {
      setPending(undefined)
    }
  }

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-col">
        <p className="font-medium" id={`${id}-label`}>
          {label}
        </p>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div
        aria-busy={pending !== undefined}
        className="-ml-3 flex flex-wrap items-center gap-3"
      >
        <PillGroup
          label={label}
          onChange={(next) => void handleChange(next)}
          options={options}
          value={pending ?? value}
        />
        {pending === undefined ? null : (
          <span className="text-muted-foreground" role="status">
            Saving…
          </span>
        )}
      </div>
    </li>
  )
}
