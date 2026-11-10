'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** Attaches one breakpoint listener and removes it with the same query. */
function subscribeToMedia(query: string, onChange: () => void): () => void {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** Server markup has no viewport, so the first client render settles the match. */
function getServerSnapshot(): boolean {
  return false
}

/** Subscribes to a responsive breakpoint without guessing the server viewport. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToMedia(query, onChange),
    [query]
  )
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
