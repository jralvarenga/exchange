import type { Metadata } from 'next'

import { PageTabs } from '@/components/page-tabs'
import { PortfolioActivity } from '@/components/portfolio/portfolio-activity'
import { PortfolioBalances } from '@/components/portfolio/portfolio-balances'
import { PortfolioDocuments } from '@/components/portfolio/portfolio-documents'
import { PortfolioOrders } from '@/components/portfolio/portfolio-orders'
import { PortfolioPositions } from '@/components/portfolio/portfolio-positions'
import { requireSession } from '@/lib/auth/require-session'
import {
  defaultPortfolioTab,
  isPortfolioTab,
  portfolioTabs,
} from '@/lib/portfolio/tabs'
import { loadWorkspace } from '@/lib/workspaces/shell'

interface PageProps {
  searchParams: Promise<{
    tab?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: 'Portfolio',
}

/** Renders the portfolio: positions, orders, activity, balances and documents in tabs. */
export default async function PortfolioPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const [{ active }, params] = await Promise.all([
    loadWorkspace(session.user),
    searchParams,
  ])
  const tab = isPortfolioTab(params.tab) ? params.tab : defaultPortfolioTab
  const environment = active?.environment ?? 'paper'

  return (
    <div className="flex flex-1 flex-col gap-8 md:pl-24">
      <header className="flex flex-col gap-2 pt-6 md:pt-12">
        <h1 className="font-bold text-4xl tracking-tighter md:text-6xl">
          Portfolio
        </h1>
        <p className="text-lg text-muted-foreground">
          What you hold, trade and earn on your {environment} account.
        </p>
      </header>
      <PageTabs
        defaultValue={tab}
        key={tab}
        label="Portfolio views"
        panels={{
          activity: <PortfolioActivity />,
          balances: <PortfolioBalances />,
          documents: <PortfolioDocuments environment={environment} />,
          orders: <PortfolioOrders />,
          positions: <PortfolioPositions />,
        }}
        param="tab"
        tabs={portfolioTabs}
        urlDefault={defaultPortfolioTab}
      />
    </div>
  )
}
