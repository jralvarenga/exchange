'use client'

import { useBalance } from '@/hooks/use-balance'

/** Displays the current buying power, cash balance, and daily account change. */
export function AccountSummary() {
  const { data: balance } = useBalance()
  const currencyOptions = {
    currency: balance.currency,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  } as const
  const signedCurrencyOptions = {
    ...currencyOptions,
    signDisplay: 'exceptZero',
  } as const
  const formattedDailyChange = balance.todayChange.toLocaleString(
    'en-US',
    signedCurrencyOptions
  )
  const formattedDailyChangePercent = (
    balance.todayChangePercent / 100
  ).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: 'exceptZero',
    style: 'percent',
  })
  const metrics = [
    {
      label: 'Buying power',
      value: balance.buyingPower.toLocaleString('en-US', currencyOptions),
    },
    {
      label: 'Cash balance',
      value: balance.cash.toLocaleString('en-US', currencyOptions),
    },
    {
      label: 'Daily change',
      value: `${formattedDailyChange} (${formattedDailyChangePercent})`,
    },
  ]

  return (
    <dl aria-live="polite" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          className="min-w-0 rounded-2xl bg-primary p-5 text-primary-foreground"
          key={metric.label}
        >
          <dt className="font-bold text-sm">{metric.label}</dt>
          <dd className="mt-1 break-words font-bold text-2xl text-numeric">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
