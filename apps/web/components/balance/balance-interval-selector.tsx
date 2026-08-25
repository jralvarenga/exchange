'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  onChange: (interval: BalanceInterval) => void
  value: BalanceInterval
}

const intervals: Array<{ label: string; value: BalanceInterval }> = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: 'YTD', value: 'YTD' },
  { label: 'All', value: 'ALL' },
]

/** Selects the time range used for balance performance. */
export function BalanceIntervalSelector({ onChange, value }: Props) {
  return (
    <fieldset className="flex min-w-0 flex-wrap items-center justify-end gap-1 border-0 p-0">
      <legend className="sr-only">Balance change interval</legend>
      {intervals.map((interval) => {
        const isSelected = interval.value === value

        return (
          <Button
            key={interval.value}
            type="button"
            variant={isSelected ? 'secondary' : 'ghost'}
            aria-pressed={isSelected}
            className={cn(
              'h-11 rounded-xl px-3',
              isSelected
                ? 'bg-background text-foreground hover:bg-background/90'
                : 'text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'
            )}
            onClick={() => onChange(interval.value)}
          >
            {interval.label}
          </Button>
        )
      })}
    </fieldset>
  )
}
