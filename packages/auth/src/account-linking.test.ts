import { describe, expect, test } from 'bun:test'

import { canLinkTrustedProvider } from './account-linking'

describe('canLinkTrustedProvider', () => {
  test('allows Google to join a verified local user', () => {
    expect(canLinkTrustedProvider({ emailVerified: true })).toBe(true)
  })

  test('blocks Google from joining an unverified password account', () => {
    expect(canLinkTrustedProvider({ emailVerified: false })).toBe(false)
  })
})
