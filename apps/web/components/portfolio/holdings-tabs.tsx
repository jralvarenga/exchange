'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Suspense } from 'react'

import { DataTableFallback } from '@/components/data-table-fallback'
import { ActivitiesTable } from '@/components/portfolio/activities-table'
import { OrdersTable } from '@/components/portfolio/orders-table'
import { PositionsTable } from '@/components/portfolio/positions-table'
import { usePortfolio } from '@/hooks/use-portfolio'

/** Switches the holdings view between assets, orders, and account activity. */
export function HoldingsTabs() {
  const { data: portfolio } = usePortfolio()

  return (
    <section aria-labelledby="holdings-title">
      <h2 className="sr-only" id="holdings-title">
        Assets, orders, and activity
      </h2>
      <Tabs className="gap-4" defaultValue="assets">
        <TabsList
          aria-label="Holdings view"
          className="rounded-2xl p-1 group-data-horizontal/tabs:h-11"
        >
          <TabsTrigger className="gap-2 px-4" value="assets">
            Assets
            <span className="rounded-full bg-foreground/10 px-2 font-mono tabular-nums">
              {portfolio.positions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger className="px-4" value="orders">
            Orders
          </TabsTrigger>
          <TabsTrigger className="px-4" value="activity">
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          <PositionsTable positions={portfolio.positions} />
        </TabsContent>
        <TabsContent keepMounted value="orders">
          <Suspense fallback={<DataTableFallback />}>
            <OrdersTable />
          </Suspense>
        </TabsContent>
        <TabsContent keepMounted value="activity">
          <Suspense fallback={<DataTableFallback />}>
            <ActivitiesTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  )
}
