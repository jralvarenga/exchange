'use client'

import { Suspense } from 'react'

import { ActivityFallback } from '@/components/activity/activity-fallback'
import { ActivityList } from '@/components/activity/activity-list'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'

interface Props {
  limit?: number
  pageSize?: number
}

/** Loads and displays account activity rows. */
export function Activity({ limit, pageSize }: Props) {
  return (
    <BalanceErrorBoundary
      fallback={
        <p className="font-medium text-muted-foreground">
          Activity unavailable
        </p>
      }
    >
      <Suspense fallback={<ActivityFallback />}>
        <ActivityList limit={limit} pageSize={pageSize} />
      </Suspense>
    </BalanceErrorBoundary>
  )
}
