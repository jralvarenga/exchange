import type { ReactNode } from 'react'

import { MobileTabBar } from '@/components/mobile-tab-bar'
import { Navbar } from '@/components/navbar'
import { OrderWorkspace } from '@/components/order-ticket/order-workspace'
import { Sidebar } from '@/components/sidebar'
import { OrderTicketProvider } from '@/contexts/order-ticket-context'
import type { ShellUser, ShellWorkspace } from '@/lib/navigation'

interface Props {
  /** False for a member on a live connection: only owners trade live. */
  canTrade: boolean
  children: ReactNode
  environment: 'live' | 'paper'
  user: ShellUser
  workspace: ShellWorkspace
}

/** Floats the navigation layers over a page that scrolls behind them. */
export function AppShell({
  canTrade,
  children,
  environment,
  user,
  workspace,
}: Props) {
  return (
    <OrderTicketProvider canTrade={canTrade} environment={environment}>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-background px-4 py-3 text-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-3 focus:ring-ring"
        >
          Skip to main content
        </a>
        <Sidebar />
        <Navbar user={user} workspace={workspace} />
        <main
          id="main"
          className="flex flex-1 flex-col px-4 pt-22 pb-28 sm:px-6 md:pb-5"
        >
          <OrderWorkspace>{children}</OrderWorkspace>
        </main>
        <MobileTabBar />
      </div>
    </OrderTicketProvider>
  )
}
