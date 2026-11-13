import { describe, expect, test } from 'bun:test'

import { safeNextPath } from '@/lib/auth/next-path'

describe('safeNextPath', () => {
  test('keeps same-site paths', () => {
    expect(safeNextPath('/invite/abc-DEF_123')).toBe('/invite/abc-DEF_123')
    expect(safeNextPath('/account')).toBe('/account')
  })

  test('rejects other sites and missing values', () => {
    expect(safeNextPath('//evil.example')).toBe('/')
    expect(safeNextPath('/\\evil.example')).toBe('/')
    expect(safeNextPath('https://evil.example')).toBe('/')
    expect(safeNextPath('/a?b=//c')).toBe('/')
    expect(safeNextPath(undefined)).toBe('/')
    expect(safeNextPath(['/a'])).toBe('/')
  })
})
