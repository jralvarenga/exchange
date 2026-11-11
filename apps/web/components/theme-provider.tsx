'use client'

import { useEffect } from 'react'

import {
  applyTheme,
  DARK_MODE_QUERY,
  getStoredTheme,
  isThemeStorageEvent,
  setTheme,
} from '@/lib/theme'

interface Props {
  children: React.ReactNode
}

/** Provides script-free system, light, and dark theme behavior. */
export function ThemeProvider({ children }: Props) {
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MODE_QUERY)

    /** Applies system changes while the stored preference is system. */
    function onSystemThemeChange(): void {
      if (getStoredTheme() === 'system') {
        applyTheme('system')
      }
    }

    /** Synchronizes theme changes made in another browser tab. */
    function onStorage(event: StorageEvent): void {
      if (!isThemeStorageEvent(event)) {
        return
      }

      applyTheme(getStoredTheme())
    }

    /** Toggles light and dark themes with the D keyboard shortcut. */
    function onKeyDown(event: KeyboardEvent): void {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== 'd' ||
        isTypingTarget(event.target)
      ) {
        return
      }

      setTheme(
        document.documentElement.classList.contains('dark') ? 'light' : 'dark'
      )
    }

    applyTheme(getStoredTheme())
    mediaQuery.addEventListener('change', onSystemThemeChange)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('storage', onStorage)

    return () => {
      mediaQuery.removeEventListener('change', onSystemThemeChange)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return children
}

/** Checks whether a keyboard event came from an editable control. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}
