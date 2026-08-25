'use client'

import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
}

type Theme = 'dark' | 'light' | 'system'

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'
const STORAGE_KEY = 'theme'

/** Provides script-free system, light, and dark theme behavior. */
export function ThemeProvider({ children }: Props) {
  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MODE_QUERY)

    /** Returns the saved theme or the system default. */
    function getStoredTheme(): Theme {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY)

      return isTheme(storedTheme) ? storedTheme : 'system'
    }

    /** Applies a theme to the root element and browser controls. */
    function applyTheme(theme: Theme): void {
      const isDark =
        theme === 'dark' || (theme === 'system' && mediaQuery.matches)

      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    }

    /** Applies system changes while the stored preference is system. */
    function onSystemThemeChange(): void {
      if (getStoredTheme() === 'system') {
        applyTheme('system')
      }
    }

    /** Synchronizes theme changes made in another browser tab. */
    function onStorage(event: StorageEvent): void {
      if (event.key !== STORAGE_KEY) {
        return
      }

      applyTheme(isTheme(event.newValue) ? event.newValue : 'system')
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

      const theme = document.documentElement.classList.contains('dark')
        ? 'light'
        : 'dark'

      window.localStorage.setItem(STORAGE_KEY, theme)
      applyTheme(theme)
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

/** Checks whether a stored string is a supported theme. */
function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
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
