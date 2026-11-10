import { afterEach, describe, expect, test } from 'bun:test'

import {
  getStoredTheme,
  isThemeStorageEvent,
  setTheme,
  THEME_STORAGE_KEY,
} from '@/lib/theme'

interface MockStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function installThemeGlobals(storage: MockStorage): void {
  const documentElement = {
    classList: {
      toggle: () => undefined,
    },
    style: {
      colorScheme: '',
    },
  }

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
    writable: true,
  })

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      dispatchEvent: () => true,
      localStorage: storage,
      matchMedia: () => ({ matches: false }),
    },
    writable: true,
  })
}

function throwingStorage(): MockStorage {
  return {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  }
}

afterEach(() => {
  installThemeGlobals({
    getItem: () => null,
    setItem: () => undefined,
  })
  getStoredTheme()
})

describe('isThemeStorageEvent', () => {
  test('treats a clear() event as a theme reset', () => {
    expect(isThemeStorageEvent({ key: null })).toBe(true)
    expect(isThemeStorageEvent({ key: THEME_STORAGE_KEY })).toBe(true)
    expect(isThemeStorageEvent({ key: 'unrelated' })).toBe(false)
  })
})

describe('getStoredTheme', () => {
  test('returns a valid stored theme', () => {
    installThemeGlobals({
      getItem: () => 'dark',
      setItem: () => undefined,
    })

    expect(getStoredTheme()).toBe('dark')
  })

  test('keeps the chosen theme when storage is blocked', () => {
    installThemeGlobals(throwingStorage())
    setTheme('dark')

    expect(getStoredTheme()).toBe('dark')
  })

  test('falls back to system when nothing valid is stored', () => {
    installThemeGlobals({
      getItem: () => 'neon',
      setItem: () => undefined,
    })

    expect(getStoredTheme()).toBe('system')
  })
})
