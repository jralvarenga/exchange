import { describe, expect, test } from 'bun:test'

import { isAccountSectionId } from '@/lib/account/sections'

describe('isAccountSectionId', () => {
  test('accepts account section ids used by legacy redirects', () => {
    expect(isAccountSectionId('connections')).toBe(true)
    expect(isAccountSectionId('funding')).toBe(true)
  })

  test('rejects unknown section ids', () => {
    expect(isAccountSectionId('settings')).toBe(false)
    expect(isAccountSectionId('')).toBe(false)
  })
})
