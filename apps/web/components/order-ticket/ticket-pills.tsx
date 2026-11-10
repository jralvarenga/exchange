import { Button } from '@workspace/ui/components/button'

interface Props<T extends string> {
  hideLabel?: boolean
  label: string
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  value: T
}

/** Provides labeled, touch-sized choices with a visible pressed state. */
export function TicketPills<T extends string>({
  hideLabel = false,
  label,
  onChange,
  options,
  value,
}: Props<T>) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-muted-foreground'}>
        {label}
      </legend>
      {options.map((option) => (
        <Button
          aria-pressed={value === option.value}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
          className="min-h-11 px-3 text-base"
          variant={value === option.value ? 'secondary' : 'ghost'}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  )
}
