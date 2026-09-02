'use client'

import { Suspense } from 'react'

import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { BalancesFallback } from '@/components/balance/balances-fallback'
import { BalancesSummary } from '@/components/balance/balances-summary'

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
      <Suspense fallback={<BalancesFallback />}>
        <BalancesSummary />
      </Suspense>
    </BalanceErrorBoundary>
  )
}
