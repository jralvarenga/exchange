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

/** Renders a row of ghost buttons where the one active option is a raised secondary button. */
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
