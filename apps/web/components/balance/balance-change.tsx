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

/** Shows the signed percent change for one interval beside the balance. */
export function BalanceChange({ interval }: Props) {
  const { data } = useBalanceChange({ interval })
  const ChangeIcon = data.percent < 0 ? ArrowDownRight : ArrowUpRight
  const direction =
    data.percent < 0 ? 'Down' : data.percent > 0 ? 'Up' : 'Unchanged'
  const percent = formatSignedPercent({ value: data.percent })

  return (
    <p
      className={cn(
        'inline-flex items-center gap-1 font-medium text-2xl tabular-nums tracking-tight md:text-4xl',
        revealClassName,
        'fill-mode-both delay-100',
        data.percent > 0 && 'text-market-up',
        data.percent < 0 && 'text-market-down',
        data.percent === 0 && 'text-muted-foreground'
      )}
      title={formatSignedCurrency({
        currency: data.currency,
        value: data.amount,
      })}
    >
      {data.percent === 0 ? null : (
        <ChangeIcon aria-hidden="true" className="size-6 md:size-8" />
      )}
      <TextMorph
        as="span"
        duration={700}
        ease="cubic-bezier(0.19, 1, 0.22, 1)"
        locale="en-US"
      >
        {percent}
      </TextMorph>
      <span className="sr-only">
        {direction}{' '}
        {formatSignedCurrency({ currency: data.currency, value: data.amount })}{' '}
        over {interval}
      </span>
    </p>
  )
}
