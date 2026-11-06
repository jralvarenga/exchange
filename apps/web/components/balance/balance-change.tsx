'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { TextMorph } from 'torph/react'

import { useBalanceChange } from '@/hooks/use-balance-change'
import type { BalanceInterval } from '@/lib/alpaca/schemas'
import {
  formatSignedCurrency,
  formatSignedPercent,
  revealClassName,
} from '@/lib/utils'

interface Props {
  interval: BalanceInterval
}

interface ChangeDirectionOptions {
  amount: number
  percent: number
}

type ChangeDirection = 'Down' | 'Unchanged' | 'Up'

/** Picks gain/loss direction from percent, falling back to the absolute amount. */
function getChangeDirection(options: ChangeDirectionOptions): ChangeDirection {
  const value = options.percent === 0 ? options.amount : options.percent

  if (value > 0) {
    return 'Up'
  }

  if (value < 0) {
    return 'Down'
  }

  return 'Unchanged'
}

/** Shows the signed percent change for one interval beside the balance. */
export function BalanceChange({ interval }: Props) {
  const { data } = useBalanceChange({ interval })
  const direction = getChangeDirection({
    amount: data.amount,
    percent: data.percent,
  })
  const ChangeIcon = direction === 'Down' ? ArrowDownRight : ArrowUpRight
  const displayValue =
    data.percent === 0 && data.amount !== 0
      ? formatSignedCurrency({ currency: data.currency, value: data.amount })
      : formatSignedPercent({ value: data.percent })

  return (
    <p
      className={cn(
        'inline-flex items-center gap-1 font-medium text-2xl tabular-nums tracking-tight md:text-4xl',
        revealClassName,
        'fill-mode-both delay-100',
        direction === 'Up' && 'text-market-up',
        direction === 'Down' && 'text-market-down',
        direction === 'Unchanged' && 'text-muted-foreground'
      )}
      title={formatSignedCurrency({
        currency: data.currency,
        value: data.amount,
      })}
    >
      {direction === 'Unchanged' ? null : (
        <ChangeIcon aria-hidden="true" className="size-6 md:size-8" />
      )}
      <TextMorph
        as="span"
        duration={700}
        ease="cubic-bezier(0.19, 1, 0.22, 1)"
        locale="en-US"
      >
        {displayValue}
      </TextMorph>
      <span className="sr-only">
        {direction}{' '}
        {formatSignedCurrency({ currency: data.currency, value: data.amount })}{' '}
        over {interval}
      </span>
    </p>
  )
}
