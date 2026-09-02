'use client'

import { cn } from '@workspace/ui/lib/utils'

import { useBalance } from '@/hooks/use-balance'
import { formatCurrency, formatSignedCurrency } from '@/lib/utils'

interface ChangeToneOptions {
  value: number
}

/** Returns the text token that reflects a signed numeric change. */
function getChangeToneClass(options: ChangeToneOptions): string {
  if (options.value > 0) {
    return 'text-success'
  }

  if (options.value < 0) {
    return 'text-danger'
  }

  return 'text-muted-foreground'
}

/** Shows buying power, cash, and daily change from the current balance. */
export function BalancesSummary() {
  const { data } = useBalance()

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-muted-foreground">Buying power</dt>
        <dd className="font-medium font-mono tabular-nums">
          {formatCurrency({
            currency: data.currency,
            value: data.buyingPower,
          })}
        </dd>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-muted-foreground">Cash</dt>
        <dd className="font-medium font-mono tabular-nums">
          {formatCurrency({
            currency: data.currency,
            value: data.cash,
          })}
        </dd>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-muted-foreground">Daily change</dt>
        <dd
          className={cn(
            'font-medium font-mono tabular-nums',
            getChangeToneClass({ value: data.todayChange })
          )}
        >
          {formatSignedCurrency({
            currency: data.currency,
            value: data.todayChange,
          })}
        </dd>
      </div>
    </dl>
  )
}
