'use client'

import { Skeleton } from '@workspace/ui/components/skeleton'
import { Suspense } from 'react'

import { BalanceChange } from '@/components/balance/balance-change'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { BalanceIntervalSelector } from '@/components/balance/balance-interval-selector'
import { BalanceValue } from '@/components/balance/balance-value'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  interval: BalanceInterval
  onChange: (interval: BalanceInterval) => void
}

/** Coordinates balance data with the selected performance interval. */
export function BalanceDetails({ interval, onChange }: Props) {
  return (
    <div className="flex flex-row items-end justify-between gap-5">
      <div className="flex flex-col gap-3">
        <BalanceErrorBoundary
          fallback={
            <p className="font-medium text-primary-foreground/80">
              Balance unavailable
            </p>
          }
        >
          <Suspense
            fallback={
              <Skeleton className="h-12 w-56 bg-primary-foreground/20" />
            }
          >
            <BalanceValue />
          </Suspense>
        </BalanceErrorBoundary>
        <BalanceErrorBoundary
          fallback={
            <p className="font-medium text-primary-foreground/80">
              Change unavailable
            </p>
          }
          resetKey={interval}
        >
          <Suspense
            fallback={
              <Skeleton className="h-8 w-44 bg-primary-foreground/20" />
            }
          >
            <BalanceChange interval={interval} />
          </Suspense>
        </BalanceErrorBoundary>
      </div>
      <BalanceIntervalSelector onChange={onChange} value={interval} />
    </div>
  )
}
