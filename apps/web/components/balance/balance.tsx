'use client'

import { useState } from 'react'

import { BalanceChart } from '@/components/balance/balance-chart'
import { BalanceChartFallback } from '@/components/balance/balance-chart-fallback'
import { BalanceDetails } from '@/components/balance/balance-details'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { BalanceIntervalSelector } from '@/components/balance/balance-interval-selector'
import { ClientSuspense } from '@/components/client-suspense'
import { initialBalanceInterval } from '@/lib/alpaca/query-keys'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

/** Leads the page with the live balance over a full-bleed equity chart. */
export function Balance() {
  const [interval, setInterval] = useState<BalanceInterval>(
    initialBalanceInterval
  )

  return (
    <section
      aria-labelledby="balance-title"
      className="-mx-4 flex flex-col sm:-mx-6"
    >
      <h2 className="sr-only" id="balance-title">
        Balance
      </h2>
      <div className="flex flex-col gap-6 px-4 pt-6 sm:px-6 md:flex-row md:items-end md:justify-between md:pt-12 md:pl-30">
        <BalanceDetails interval={interval} />
        <BalanceIntervalSelector onChange={setInterval} value={interval} />
      </div>
      <div className="h-72 w-full md:h-112">
        <BalanceErrorBoundary
          fallback={
            <p className="px-4 font-medium text-muted-foreground sm:px-6 md:pl-30">
              Chart unavailable
            </p>
          }
          resetKey={interval}
        >
          <ClientSuspense fallback={<BalanceChartFallback />}>
            <BalanceChart interval={interval} />
          </ClientSuspense>
        </BalanceErrorBoundary>
      </div>
    </section>
  )
}
