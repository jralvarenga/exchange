import { describe, expect, test } from 'bun:test'

import { isSignUpEmailAllowed, resolveSignUpPolicy } from './sign-up-policy'

describe('resolveSignUpPolicy', () => {
  test('closes sign-up in production when no allowlist is set', () => {
    expect(
      resolveSignUpPolicy({
        NODE_ENV: 'production',
      })
    ).toEqual({
      allowedEmails: undefined,
      disableSignUp: true,
    })
  })

  test('closes sign-up when only VERCEL_ENV is production', () => {
    expect(
      resolveSignUpPolicy({
        VERCEL_ENV: 'production',
      })
    ).toEqual({
      allowedEmails: undefined,
      disableSignUp: true,
    })
  })

  test('keeps preview sign-up open when NODE_ENV is production', () => {
    expect(
      resolveSignUpPolicy({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
      })
    ).toEqual({
      allowedEmails: undefined,
      disableSignUp: false,
    })
  })

  test('keeps sign-up open in development by default', () => {
    expect(
      resolveSignUpPolicy({
        NODE_ENV: 'development',
      })
    ).toEqual({
      allowedEmails: undefined,
      disableSignUp: false,
    })
  })

  test('lets an allowlist override a closed production default', () => {
    expect(
      resolveSignUpPolicy({
        AUTH_ALLOWED_EMAILS: 'Owner@example.com, other@example.com',
        NODE_ENV: 'production',
      })
    ).toEqual({
      allowedEmails: ['owner@example.com', 'other@example.com'],
      disableSignUp: false,
    })
  })

  test('honors AUTH_DISABLE_SIGNUP when no allowlist is set', () => {
    expect(
      resolveSignUpPolicy({
        AUTH_DISABLE_SIGNUP: 'true',
        NODE_ENV: 'development',
      }).disableSignUp
    ).toBe(true)
    expect(
      resolveSignUpPolicy({
        AUTH_DISABLE_SIGNUP: 'false',
        NODE_ENV: 'production',
      }).disableSignUp
    ).toBe(false)
  })
})

describe('isSignUpEmailAllowed', () => {
  test('allows only listed addresses when an allowlist is set', () => {
    const source = {
      AUTH_ALLOWED_EMAILS: 'owner@example.com',
      NODE_ENV: 'production',
    }

    expect(isSignUpEmailAllowed('owner@example.com', source)).toBe(true)
    expect(isSignUpEmailAllowed('Owner@example.com', source)).toBe(true)
    expect(isSignUpEmailAllowed('other@example.com', source)).toBe(false)
  })

  test('rejects every address when production sign-up is closed', () => {
    expect(
      isSignUpEmailAllowed('owner@example.com', { NODE_ENV: 'production' })
    ).toBe(false)
  })
})
