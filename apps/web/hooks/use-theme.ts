import { useSyncExternalStore } from 'react'

import {
  getStoredTheme,
  isThemeStorageEvent,
  setTheme,
  THEME_CHANGE_EVENT,
  type Theme,
} from '@/lib/theme'

interface UseThemeResult {
  setTheme: (theme: Theme) => void
  theme: Theme
}

/** Subscribes to theme changes from this tab, other tabs, and the D shortcut. */
function subscribe(onChange: () => void): () => void {
  function onStorage(event: StorageEvent): void {
    if (isThemeStorageEvent(event)) {
      onChange()
    }
  }

  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** Reads the saved theme preference and returns a setter that applies it. */
export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    getStoredTheme,
    () => 'system'
  )

  return { setTheme, theme }
}
