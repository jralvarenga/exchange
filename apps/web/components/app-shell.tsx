import type { ReactNode } from 'react'

import { MobileTabBar } from '@/components/mobile-tab-bar'
import { Navbar } from '@/components/navbar'
import { OrderWorkspace } from '@/components/order-ticket/order-workspace'
import { Sidebar } from '@/components/sidebar'
import { OrderTicketProvider } from '@/contexts/order-ticket-context'
import type { ShellUser, ShellWorkspace } from '@/lib/navigation'
import type { TradeLock } from '@/lib/workspaces/permissions'

interface Props {
  children: ReactNode
  environment: 'live' | 'paper'
  /** Why this person cannot trade on the active connection, if they cannot. */
  tradeLock: TradeLock | null
  user: ShellUser
  workspace: ShellWorkspace
}

/** Floats the navigation layers over a page that scrolls behind them. */
export function AppShell({
  children,
  environment,
  tradeLock,
  user,
  workspace,
}: Props) {
  return (
    <OrderTicketProvider
      accountKey={`${workspace.id}:${workspace.activeConnectionId ?? 'none'}`}
      environment={environment}
      tradeLock={tradeLock}
    >
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
