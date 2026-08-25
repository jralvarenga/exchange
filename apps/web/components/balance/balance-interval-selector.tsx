'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'

import {
  type BalanceInterval,
  balanceIntervalSchema,
} from '@/lib/alpaca/schemas'

interface Props {
  onChange: (interval: BalanceInterval) => void
  value: BalanceInterval
}

const intervals: Array<{ label: string; value: BalanceInterval }> = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' },
]

/** Selects the time range used for balance performance. */
export function BalanceIntervalSelector({ onChange, value }: Props) {
  return (
    <div>
      <Select
        items={intervals}
        value={value}
        onValueChange={(selectedValue) =>
          onChange(balanceIntervalSchema.parse(selectedValue))
        }
      >
        <SelectTrigger
          aria-label="Balance change interval"
          className="min-w-20 font-bold"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {intervals.map((interval) => (
            <SelectItem key={interval.value} value={interval.value}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
