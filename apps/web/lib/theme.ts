export type Theme = 'dark' | 'light' | 'system'

export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'
export const THEME_STORAGE_KEY = 'theme'

/** Event fired in this tab whenever the stored theme changes. */
export const THEME_CHANGE_EVENT = 'exchange:theme-change'

let sessionTheme: Theme = 'system'

/** Checks whether a stored string is a supported theme. */
export function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
}

/**
 * Returns whether a storage event should refresh the theme, including a
 * `localStorage.clear()` in another tab (`event.key === null`).
 */
export function isThemeStorageEvent(event: Pick<StorageEvent, 'key'>): boolean {
  return event.key === null || event.key === THEME_STORAGE_KEY
}

/** Returns the saved theme, or the in-memory choice when storage is blocked. */
export function getStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    sessionTheme = isTheme(storedTheme) ? storedTheme : 'system'

    return sessionTheme
  } catch {
    return sessionTheme
  }
}

/** Applies a theme to the root element and the browser controls. */
export function applyTheme(theme: Theme): void {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia(DARK_MODE_QUERY).matches)

  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

/** Saves, applies, and announces a theme so every picker stays in sync. */
export function setTheme(theme: Theme): void {
  sessionTheme = theme

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private windows can block storage. The theme still applies to this page.
  }

  applyTheme(theme)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}
