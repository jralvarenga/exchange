'use client'

import { BalanceChange } from '@/components/balance/balance-change'
import { BalanceChangeFallback } from '@/components/balance/balance-change-fallback'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { BalanceUpdatedAt } from '@/components/balance/balance-updated-at'
import { BalanceUpdatedAtFallback } from '@/components/balance/balance-updated-at-fallback'
import { BalanceValue } from '@/components/balance/balance-value'
import { BalanceValueFallback } from '@/components/balance/balance-value-fallback'
import { ClientSuspense } from '@/components/client-suspense'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  interval: BalanceInterval
}

/** Stacks the live balance, its interval change, and the refresh time. */
export function BalanceDetails({ interval }: Props) {
  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <BalanceErrorBoundary
          fallback={
            <p className="font-medium text-muted-foreground">
              Balance unavailable
            </p>
          }
        >
          <ClientSuspense fallback={<BalanceValueFallback />}>
            <BalanceValue />
          </ClientSuspense>
        </BalanceErrorBoundary>
        <BalanceErrorBoundary
          fallback={
            <p className="font-medium text-muted-foreground">
              Change unavailable
            </p>
          }
          resetKey={interval}
        >
          <ClientSuspense fallback={<BalanceChangeFallback />}>
            <BalanceChange interval={interval} />
          </ClientSuspense>
        </BalanceErrorBoundary>
      </div>
      <BalanceErrorBoundary fallback={null}>
        <ClientSuspense fallback={<BalanceUpdatedAtFallback />}>
          <BalanceUpdatedAt />
        </ClientSuspense>
      </BalanceErrorBoundary>
    </div>
  )
}
