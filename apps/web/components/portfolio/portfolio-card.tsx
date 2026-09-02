'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Suspense } from 'react'

import { BalanceErrorBoundary } from '@/components/balance/balance-error-boundary'
import { PortfolioActivity } from '@/components/portfolio/portfolio-activity'
import { PortfolioActivityFallback } from '@/components/portfolio/portfolio-activity-fallback'
import { PortfolioAssets } from '@/components/portfolio/portfolio-assets'
import { PortfolioAssetsFallback } from '@/components/portfolio/portfolio-assets-fallback'
import { PortfolioOrders } from '@/components/portfolio/portfolio-orders'
import { PortfolioOrdersFallback } from '@/components/portfolio/portfolio-orders-fallback'

/** Renders the full-height portfolio card with assets, orders, and activity tabs. */
export function PortfolioCard() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
      </CardHeader>
      <Tabs className="flex min-h-0 flex-1 flex-col" defaultValue="assets">
        <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent
            className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4"
            value="assets"
          >
            <BalanceErrorBoundary
              fallback={
                <p className="font-medium text-muted-foreground">
                  Assets unavailable
                </p>
              }
            >
              <Suspense fallback={<PortfolioAssetsFallback />}>
                <PortfolioAssets />
              </Suspense>
            </BalanceErrorBoundary>
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4"
            value="orders"
          >
            <BalanceErrorBoundary
              fallback={
                <p className="font-medium text-muted-foreground">
                  Orders unavailable
                </p>
              }
            >
              <Suspense fallback={<PortfolioOrdersFallback />}>
                <PortfolioOrders />
              </Suspense>
            </BalanceErrorBoundary>
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4"
            value="activity"
          >
            <BalanceErrorBoundary
              fallback={
                <p className="font-medium text-muted-foreground">
                  Activity unavailable
                </p>
              }
            >
              <Suspense fallback={<PortfolioActivityFallback />}>
                <PortfolioActivity />
              </Suspense>
            </BalanceErrorBoundary>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
