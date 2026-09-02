'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'

import type { BalanceInterval } from '@/lib/alpaca/schemas'
import { balanceIntervalSchema } from '@/lib/alpaca/schemas'

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
  { label: 'ALL', value: 'ALL' },
]

/** Lets the trader pick the performance interval for balance change. */
export function BalanceIntervalSelector({ onChange, value }: Props) {
  /** Applies a validated interval from the select. */
  function handleValueChange(nextValue: BalanceInterval | null): void {
    const parsed = balanceIntervalSchema.safeParse(nextValue)

    if (!parsed.success) {
      return
    }

    onChange(parsed.data)
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        items={intervalOptions}
        onValueChange={handleValueChange}
        value={value}
      >
        <SelectTrigger
          className="min-h-11border-transparent bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 focus-visible:border-primary-foreground/40 focus-visible:ring-primary-foreground/30 [&_svg]:text-primary-foreground"
          id="balance-interval"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {intervalOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
