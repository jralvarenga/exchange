'use client'

import { cn } from '@workspace/ui/lib/utils'

import { useBalanceChange } from '@/hooks/use-balance-change'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  interval: BalanceInterval
}

/** Displays signed percentage and currency changes for one interval. */
export function BalanceChange({ interval }: Props) {
  const { data: change } = useBalanceChange({ interval })
  const isGain = change.amount >= 0
  const direction =
    change.amount > 0 ? 'Gain' : change.amount < 0 ? 'Loss' : 'No change'
  const formattedPercent = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: 'exceptZero',
    style: 'percent',
  }).format(change.percent / 100)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    currency: change.currency,
    currencyDisplay: 'narrowSymbol',
    signDisplay: 'exceptZero',
    style: 'currency',
  }).format(change.amount)

  return (
    <output className="flex flex-wrap items-baseline gap-1" aria-live="polite">
      <span className="sr-only">{direction}: </span>
      <span
        className={cn(
          'rounded-md bg-background/90 px-2 py-1 text-sm',
          isGain ? 'text-success' : 'text-danger'
        )}
      >
        {formattedPercent}
      </span>
      <span className={cn(
          'rounded-md bg-background/90 px-2 py-1 text-sm',
          "text-primary-foreground",
          isGain ? 'text-success' : 'text-danger'
        )}
      >
        {formattedAmount}
      </span>
    </output>
  )
}
