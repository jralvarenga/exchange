'use client'

import { Suspense, useState } from 'react'

import { BalanceChart } from '@/components/balance/balance-chart'
import { BalanceChartFallback } from '@/components/balance/balance-chart-fallback'
import { BalanceDetails } from '@/components/balance/balance-details'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { initialBalanceInterval } from '@/lib/alpaca/query-keys'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

/** Coordinates the balance chart and details around one interval. */
export function Balance() {
  const [interval, setInterval] = useState<BalanceInterval>(
    initialBalanceInterval
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <BalanceErrorBoundary
          fallback={
            <p className="px-4 font-medium text-primary-foreground/80">
              Chart unavailable
            </p>
          }
          resetKey={interval}
        >
          <Suspense fallback={<BalanceChartFallback />}>
            <BalanceChart interval={interval} />
          </Suspense>
        </BalanceErrorBoundary>
      </div>
      <div className="px-4 pt-4 pb-4">
        <BalanceDetails interval={interval} onChange={setInterval} />
      </div>
    </div>
  )
}
