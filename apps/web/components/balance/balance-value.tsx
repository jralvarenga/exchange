'use client'

import { useBalance } from '@/hooks/use-balance'

/** Displays the current Alpaca account equity using React Query. */
export function BalanceValue() {
  const { data: balance } = useBalance()
  const formattedBalance = new Intl.NumberFormat('en-US', {
    currency: balance.currency,
    style: 'currency',
  }).format(balance.equity)

  return (
    <h1
      className="min-w-0 font-bold text-4xl text-numeric sm:text-5xl"
      aria-live="polite"
    >
      {formattedBalance}
    </h1>
  )
}
