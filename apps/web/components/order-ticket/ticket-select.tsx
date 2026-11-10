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
  /** Explains why the options are limited, below the control. */
  description?: string
  error?: string
  label: string
  name: string
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  value: T
}

/** Renders a labeled selection with its inline validation message. */
export function TicketSelect<T extends string>({
  description,
  error,
  label,
  name,
  onChange,
  options,
  value,
}: Props<T>) {
  const id = useId()
  const describedBy = [
    description ? `${id}-description` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter((item) => item !== undefined)
    .join(' ')
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} id={`${id}-label`}>
        {label}
      </Label>
      <Select
        items={options}
        onValueChange={(next) => {
          if (next !== null) onChange(next)
        }}
        value={value}
      >
        <SelectTrigger
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          aria-labelledby={`${id}-label`}
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
      {description ? (
        <p className="text-muted-foreground" id={`${id}-description`}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
