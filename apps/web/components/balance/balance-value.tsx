'use client'

import { useBalance } from '@/hooks/use-balance'
import { formatCurrencyParts } from '@/lib/utils'

/** Renders the current account equity as a large currency figure. */
export function BalanceValue() {
  const { data } = useBalance()
  const equityParts = formatCurrencyParts({
    currency: data.currency,
    value: data.equity,
  })

  return (
    <p
      aria-live="polite"
      className="flex items-baseline gap-1.5 font-mono tabular-nums"
    >
      <span className="text-2xl text-primary-foreground/80 md:text-3xl">
        {equityParts.symbol}
      </span>
      <span className="font-bold text-4xl tracking-tight md:text-5xl">
        {equityParts.amount}
      </span>
    </p>
  )
}
