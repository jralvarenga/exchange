'use client'

import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { BalancesFallback } from '@/components/balance/balances-fallback'
import { BalancesSummary } from '@/components/balance/balances-summary'
import { ClientSuspense } from '@/components/client-suspense'

/** Loads and displays buying power, cash, and daily change. */
export function Balances() {
  return (
    <BalanceErrorBoundary
      fallback={
        <p className="font-medium text-muted-foreground">
          Balances unavailable
        </p>
      }
    >
      <ClientSuspense fallback={<BalancesFallback />}>
        <BalancesSummary />
      </ClientSuspense>
    </BalanceErrorBoundary>
  )
}
