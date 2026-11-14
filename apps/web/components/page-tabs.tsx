'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { type ReactNode, useEffect, useState } from 'react'

export type PageTab<T extends string> = {
  label: string
  value: T
}

interface Props<T extends string> {
  /** The tab shown first, already read from the URL by the page. */
  defaultValue: T
  /** Names the tab list for assistive technology. */
  label: string
  panels: Record<T, ReactNode>
  /** The search param that holds the open tab, such as `tab` or `section`. */
  param: string
  tabs: readonly PageTab<T>[]
  /** The tab that needs no search param; opening it leaves the URL bare. */
  urlDefault: T
}

/**
 * Splits a screen into tabs. Only the open panel is mounted, so only its data
 * loads, and the open tab is kept in the URL so it survives a reload and can
 * be linked to. A legacy `#tab` link is read once and moved into the URL.
 */
export function PageTabs<T extends string>({
  defaultValue,
  label,
  panels,
  param,
  tabs,
  urlDefault,
}: Props<T>) {
  const [value, setValue] = useState<T>(defaultValue)
  const [ready, setReady] = useState(false)

  /** Records a tab in the URL without adding a history entry. */
  function writeUrl(next: T): void {
    const url = new URL(window.location.href)

    if (next === urlDefault) {
      url.searchParams.delete(param)
    } else {
      url.searchParams.set(param, next)
    }

    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }

  /** Opens a tab picked from the list. */
  function handleValueChange(next: unknown): void {
    const tab = tabs.find((option) => option.value === next)

    if (!tab) {
      return
    }

    setValue(tab.value)
    writeUrl(tab.value)
  }

  // Older links point at `#section` anchors; open that tab instead.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount for the initial hash only.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const tab = tabs.find((option) => option.value === hash)

    if (tab) {
      setValue(tab.value)
      writeUrl(tab.value)
    }
    setReady(true)
  }, [])

  return (
    <Tabs onValueChange={handleValueChange} value={value}>
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList aria-label={label}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {ready &&
        tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {panels[tab.value]}
          </TabsContent>
        ))}
    </Tabs>
  )
}
