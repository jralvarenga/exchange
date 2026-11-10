export type Theme = 'dark' | 'light' | 'system'

export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'
export const THEME_STORAGE_KEY = 'theme'

/** Event fired in this tab whenever the stored theme changes. */
export const THEME_CHANGE_EVENT = 'exchange:theme-change'

/** Checks whether a stored string is a supported theme. */
export function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system'
}

/** Returns the saved theme, or system when nothing valid is stored. */
export function getStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    return isTheme(storedTheme) ? storedTheme : 'system'
  } catch {
    return 'system'
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
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private windows can block storage. The theme still applies to this page.
  }

  applyTheme(theme)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}
