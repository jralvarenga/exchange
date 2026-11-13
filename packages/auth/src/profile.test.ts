import { describe, expect, test } from 'bun:test'

import {
  isAllowedProfileImage,
  MAX_PROFILE_IMAGE_LENGTH,
  personalWorkspaceName,
} from './profile'

describe('isAllowedProfileImage', () => {
  test('allows no photo', () => {
    expect(isAllowedProfileImage(undefined)).toBe(true)
    expect(isAllowedProfileImage(null)).toBe(true)
    expect(isAllowedProfileImage('')).toBe(true)
  })

  test('allows https photos and small image data URLs', () => {
    expect(isAllowedProfileImage('https://lh3.googleusercontent.com/a')).toBe(
      true
    )
    expect(isAllowedProfileImage('data:image/webp;base64,UklGRg==')).toBe(true)
  })

  test('rejects photo hosts other than Google and oversized URLs', () => {
    expect(isAllowedProfileImage('https://example.com/me.png')).toBe(false)
    expect(
      isAllowedProfileImage('https://evil.com/googleusercontent.com.png')
    ).toBe(false)
    expect(
      isAllowedProfileImage(
        `https://lh3.googleusercontent.com/${'a'.repeat(130_000)}`
      )
    ).toBe(false)
  })

  test('rejects other schemes, types and oversized data', () => {
    expect(isAllowedProfileImage('http://example.com/a.png')).toBe(false)
    expect(isAllowedProfileImage('javascript:alert(1)')).toBe(false)
    expect(isAllowedProfileImage('data:image/svg+xml;base64,PHN2Zz4=')).toBe(
      false
    )
    expect(
      isAllowedProfileImage(
        `data:image/png;base64,${'A'.repeat(MAX_PROFILE_IMAGE_LENGTH)}`
      )
    ).toBe(false)
  })
})

describe('personalWorkspaceName', () => {
  test('uses the first name', () => {
    expect(personalWorkspaceName('Ana Lopez')).toBe("Ana's workspace")
  })

  test('falls back when the name is blank', () => {
    expect(personalWorkspaceName('  ')).toBe('My workspace')
  })
})
