'use client'

import { Input } from '@workspace/ui/components/input'

interface Props {
  id: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

/** Filters the visible table rows by a free-text query. */
export function PortfolioTableFilter({
  id,
  onChange,
  placeholder,
  value,
}: Props) {
  return (
    <div className="flex flex-col gap-2 px-1">
      <Input
        className="md:max-w-xs"
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
