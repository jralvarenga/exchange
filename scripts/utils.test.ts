import { describe, expect, test } from 'bun:test'

import { formatPasswordHashForDotenv } from './utils'

describe('auth setup utilities', () => {
  test('escapes every bcrypt delimiter for a Next.js env file', () => {
    expect(formatPasswordHashForDotenv('$2b$12$hash')).toBe('\\$2b\\$12\\$hash')
  })
})
