'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { AssetCombobox } from '@/components/assets/asset-combobox'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import { getActiveAssetIdentifier } from '@/lib/navigation'

interface Props {
  children: ReactNode
}

/** Frames every route with the persistent desktop and mobile navigation. */
export function AppShell({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const assetIdentifier = getActiveAssetIdentifier(pathname)

  if (pathname === '/login') {
    return children
  }

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
      <div className="mx-auto grid min-h-dvh max-w-[100rem] overflow-x-clip bg-background text-foreground md:h-[calc(100dvh-2rem)] md:grid-cols-[5.5rem_minmax(0,1fr)] md:overflow-hidden md:rounded-[2.5rem]">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-col">
          <Navbar
            assetIdentifier={assetIdentifier}
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
            className="flex min-h-0 flex-1 flex-col overflow-x-clip px-4 pt-2 pb-28 sm:px-6 md:overflow-hidden md:px-4 md:pt-0 md:pr-5 md:pb-5"
          >
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </main>
        </div>
      </div>
      <MobileTabBar />
    </div>
  )
}
