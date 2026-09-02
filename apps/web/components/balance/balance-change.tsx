'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'

import { useBalanceChange } from '@/hooks/use-balance-change'
import type { BalanceInterval } from '@/lib/alpaca/schemas'
import { formatSignedCurrency, formatSignedPercent } from '@/lib/utils'

interface Props {
  interval: BalanceInterval
}

/** Shows the signed amount and percent change for one interval. */
export function BalanceChange({ interval }: Props) {
  const { data } = useBalanceChange({ interval })
  const ChangeIcon = data.percent < 0 ? ArrowDown : ArrowUp
  const direction =
    data.percent < 0 ? 'Down' : data.percent > 0 ? 'Up' : 'Unchanged'

  return (
    <p
      aria-live="polite"
      className="inline-flex flex-wrap items-center gap-2 font-medium text-primary-foreground/80"
    >
      {data.percent === 0 ? null : (
        <ChangeIcon aria-hidden="true" className="size-4" />
      )}
      <span className="font-mono tabular-nums">
        {formatSignedCurrency({
          currency: data.currency,
          value: data.amount,
        })}
      </span>
      <span className="font-mono tabular-nums">
        {formatSignedPercent({ value: data.percent })}
      </span>
      <span className="sr-only">
        {direction} {formatSignedPercent({ value: data.percent })} for the
        selected interval
      </span>
    </p>
  )
}
