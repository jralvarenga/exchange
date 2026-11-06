'use client'

import { Button } from '@workspace/ui/components/button'

export type PillOption<T extends string> = {
  label: string
  value: T
}

interface Props<T extends string> {
  label: string
  onChange: (value: T) => void
  options: PillOption<T>[]
  value: T
}

/** Renders a row of ghost buttons where exactly one option is active. */
export function PillGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: Props<T>) {
  return (
    <fieldset className="flex flex-wrap items-center gap-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <Button
          aria-pressed={option.value === value}
          className="aria-pressed:bg-muted aria-pressed:text-foreground"
          key={option.value}
          onClick={() => onChange(option.value)}
          variant="ghost"
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  )
}
