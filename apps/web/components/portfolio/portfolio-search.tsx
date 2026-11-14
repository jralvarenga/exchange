'use client'

import { Input } from '@workspace/ui/components/input'

interface Props {
  id: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

/** Narrows the list in a portfolio tab by a typed symbol or name. */
export function PortfolioSearch({
  id,
  label,
  onChange,
  placeholder,
  value,
}: Props) {
  return (
    <div className="w-full sm:max-w-xs">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Input
        autoComplete="off"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        size="lg"
        type="search"
        value={value}
      />
    </div>
  )
}
