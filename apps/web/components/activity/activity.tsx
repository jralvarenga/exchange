'use client'

import { ActivityFallback } from '@/components/activity/activity-fallback'
import { ActivityList } from '@/components/activity/activity-list'
import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { ClientSuspense } from '@/components/client-suspense'

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
      <ClientSuspense fallback={<ActivityFallback />}>
        <ActivityList limit={limit} pageSize={pageSize} />
      </ClientSuspense>
    </BalanceErrorBoundary>
  )
}
