import { Label } from '@workspace/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { useId } from 'react'

interface Props<T extends string> {
  error?: string
  label: string
  name: string
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  value: T
}

/** Renders a labeled selection with its inline validation message. */
export function TicketSelect<T extends string>({
  error,
  label,
  name,
  onChange,
  options,
  value,
}: Props<T>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next)
        }}
        value={value}
      >
        <SelectTrigger
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="w-full scroll-mt-24 scroll-mb-32"
          data-order-field={name}
          id={id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
