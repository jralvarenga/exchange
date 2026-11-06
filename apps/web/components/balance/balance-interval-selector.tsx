'use client'

import { cn } from '@workspace/ui/lib/utils'

import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  onChange: (interval: BalanceInterval) => void
  value: BalanceInterval
}

interface IntervalOption {
  label: string
  value: BalanceInterval
}

const intervalOptions: IntervalOption[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' },
]

/** Lets the trader pick the performance interval for the chart and change. */
export function BalanceIntervalSelector({ onChange, value }: Props) {
  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">Balance interval</legend>
      {intervalOptions.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={cn(
            'min-h-11 min-w-11 rounded-full px-3 font-medium text-muted-foreground tabular-nums outline-none transition-colors',
            'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
            'aria-pressed:bg-foreground aria-pressed:text-background'
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}
