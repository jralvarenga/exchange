import type { ReactNode } from 'react'

import { Navbar } from '@/components/portfolio/navbar'

interface Props {
  children: ReactNode
}

/** Persistent app chrome: top navbar, mobile tab bar, and main content. */
export function AppShell({ children }: Props) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-background focus:px-3 focus:py-2 focus:text-foreground focus:shadow-sm focus:ring-3 focus:ring-ring"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main" className="mt-10 min-h-svh p-6 pb-28 md:pb-6">
        {children}
      </main>
    </>
  )
}
