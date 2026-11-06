'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { TextMorph } from 'torph/react'

import { useBalance } from '@/hooks/use-balance'
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  revealClassName,
} from '@/lib/utils'

const morphEase = 'cubic-bezier(0.19, 1, 0.22, 1)'

/** Shows buying power, cash, and today's change as an open stats strip. */
export function BalancesSummary() {
  const { data } = useBalance()
  const ChangeIcon = data.todayChange < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <dl className="grid grid-cols-1 divide-y divide-border border-border border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className={cn('flex flex-col gap-2 py-6 sm:pr-8', revealClassName)}>
        <dt className="font-medium text-muted-foreground">Buying power</dt>
        <dd className="font-bold text-3xl tabular-nums tracking-tight">
          <TextMorph as="span" duration={700} ease={morphEase} locale="en-US">
            {formatCurrency({
              currency: data.currency,
              value: data.buyingPower,
            })}
          </TextMorph>
        </dd>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 py-6 sm:px-8',
          revealClassName,
          'fill-mode-both delay-75'
        )}
      >
        <dt className="font-medium text-muted-foreground">Cash</dt>
        <dd className="font-bold text-3xl tabular-nums tracking-tight">
          <TextMorph as="span" duration={700} ease={morphEase} locale="en-US">
            {formatCurrency({ currency: data.currency, value: data.cash })}
          </TextMorph>
        </dd>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 py-6 sm:pl-8',
          revealClassName,
          'fill-mode-both delay-150'
        )}
      >
        <dt className="font-medium text-muted-foreground">Today</dt>
        <dd
          className={cn(
            'flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums',
            data.todayChange > 0 && 'text-market-up',
            data.todayChange < 0 && 'text-market-down',
            data.todayChange === 0 && 'text-muted-foreground'
          )}
        >
          <TextMorph
            as="span"
            className="font-bold text-3xl tracking-tight"
            duration={700}
            ease={morphEase}
            locale="en-US"
          >
            {formatSignedCurrency({
              currency: data.currency,
              value: data.todayChange,
            })}
          </TextMorph>
          <span className="inline-flex items-center gap-0.5 font-medium">
            {data.todayChange === 0 ? null : (
              <ChangeIcon aria-hidden="true" className="size-4" />
            )}
            {formatSignedPercent({ value: data.todayChangePercent })}
          </span>
        </dd>
      </div>
    </dl>
  )
}
