'use client'

import { PillGroup, type PillOption } from '@/components/pill-group'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  onChange: (interval: BalanceInterval) => void
  value: BalanceInterval
}

const intervalOptions: PillOption<BalanceInterval>[] = [
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
    <PillGroup
      label="Balance interval"
      onChange={onChange}
      options={intervalOptions}
      value={value}
    />
  )
}
