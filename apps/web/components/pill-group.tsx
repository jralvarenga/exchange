'use client'

import { Button } from '@workspace/ui/components/button'

export type PillOption<T extends string> = {
  label: string
  value: T
}

interface Props<T extends string> {
  disabled?: boolean
  label: string
  onChange: (value: T) => void
  options: PillOption<T>[]
  value: T
}

/** Renders a row of ghost buttons where the one active option is a raised secondary button. */
export function PillGroup<T extends string>({
  disabled = false,
  label,
  onChange,
  options,
  value,
}: Props<T>) {
  return (
    <fieldset
      className="flex flex-wrap items-center gap-1 disabled:opacity-50"
      disabled={disabled}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <Button
          aria-pressed={option.value === value}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
          variant={option.value === value ? 'secondary' : 'ghost'}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  )
}
