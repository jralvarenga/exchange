'use client'

import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'

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
        className="h-11 min-h-11 md:max-w-xs"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  )
}
