'use client'

import { Suspense, useSyncExternalStore } from 'react'

interface Props {
  children: React.ReactNode
  fallback: React.ReactNode
}

/** Never changes, so React only uses the server and client snapshots below. */
function subscribe(): () => void {
  return () => {}
}

/**
 * Suspense boundary that only loads its children in the browser.
 * Their queries call the API with the session cookie, which a server-side
 * fetch from a client component does not have, so the server shows the fallback.
 */
export function ClientSuspense({ children, fallback }: Props) {
  const isBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!isBrowser) {
    return fallback
  }

  return <Suspense fallback={fallback}>{children}</Suspense>
}
