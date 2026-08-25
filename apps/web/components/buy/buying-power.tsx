'use client'

import { useBalance } from '@/hooks/use-balance'

/** Displays the account buying power available for a new order. */
export function BuyingPower() {
  const { data: balance } = useBalance()

  return (
    <span className="font-medium font-mono tabular-nums">
      {balance.buyingPower.toLocaleString('en-US', {
        currency: balance.currency,
        currencyDisplay: 'narrowSymbol',
        style: 'currency',
      })}
    </span>
  )
}
