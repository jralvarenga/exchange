'use client'

import { cn } from '@workspace/ui/lib/utils'
import { TextMorph } from 'torph/react'

import { useBalance } from '@/hooks/use-balance'
import { formatCurrencyParts, revealClassName } from '@/lib/utils'

/** Renders the current account equity as the page's display figure. */
export function BalanceValue() {
  const { data } = useBalance()
  const equityParts = formatCurrencyParts({
    currency: data.currency,
    value: data.equity,
  })

  return (
    <p
      className={cn('flex items-baseline gap-2 tabular-nums', revealClassName)}
    >
      <span className="font-medium text-3xl text-muted-foreground md:text-5xl">
        {equityParts.symbol}
      </span>
      <TextMorph
        as="span"
        className="font-bold text-6xl text-foreground tracking-tighter md:text-8xl"
        duration={700}
        ease="cubic-bezier(0.19, 1, 0.22, 1)"
        locale="en-US"
      >
        {equityParts.amount}
      </TextMorph>
    </p>
  )
}
