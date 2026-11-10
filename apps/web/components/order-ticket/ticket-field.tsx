import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { type ReactNode, useId } from 'react'

interface Props {
  controls?: ReactNode
  error?: string
  label: string
  name: string
  onChange: (value: string) => void
  optional?: boolean
  step?: string
  value: string
}

/** Displays one labeled numeric entry with its schema validation message. */
export function TicketField({
  controls,
  error,
  label,
  name,
  onChange,
  optional,
  step = 'any',
  value,
}: Props) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {optional ? (
            <span className="text-muted-foreground">Optional</span>
          ) : null}
        </Label>
        {controls}
      </div>
      <Input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        data-order-field={name}
        className="scroll-mt-24 scroll-mb-32"
        id={id}
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
      {error ? (
        <p className="text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
