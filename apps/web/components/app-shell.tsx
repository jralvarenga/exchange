'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { AssetCombobox } from '@/components/assets/asset-combobox'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'

interface Props {
  children: ReactNode
}

/** Frames every route with the persistent desktop and mobile navigation. */
export function AppShell({ children }: Props) {
  const router = useRouter()

  /** Navigates to the selected asset's detail route. */
  function handleAssetSelect(asset: AssetSearchResult | null): void {
    if (asset) {
      router.push(`/assets/${asset.id}`)
    }
  }

  return (
    <div>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-background px-4 py-3 text-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-3 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="mx-auto grid min-h-dvh max-w-[100rem] overflow-hidden bg-background text-foreground md:min-h-[calc(100dvh-2rem)] md:grid-cols-[5.5rem_minmax(0,1fr)] md:rounded-[2.5rem]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <Navbar
            search={
              <AssetCombobox
                className="bg-card"
                onValueChange={handleAssetSelect}
                placeholder="Search markets…"
              />
            }
          />
          <main
            id="main"
            className="min-h-0 flex-1 overflow-x-hidden px-4 pt-2 pb-28 sm:px-6 md:px-4 md:pt-0 md:pr-5 md:pb-5"
          >
            <div className="min-h-full rounded-[2rem] bg-card p-5 sm:p-6">
              {children}
            </div>
          </main>
        </div>
        <MobileTabBar />
      </div>
    </div>
  )
}
