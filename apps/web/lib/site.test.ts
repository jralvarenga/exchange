import { describe, expect, test } from 'bun:test'

import { getAppUrl } from './site'

describe('getAppUrl', () => {
  test('prefers the configured public app origin', () => {
    expect(
      getAppUrl({
        NEXT_PUBLIC_APP_URL: ' https://app.treid.app/login ',
        VERCEL_URL: 'treid-git-feat.vercel.app',
      }).toString()
    ).toBe('https://app.treid.app/')
  })

  test('falls back to the Vercel deployment host', () => {
    expect(
      getAppUrl({
        NEXT_PUBLIC_APP_URL: 'not a url',
        VERCEL_URL: 'treid-git-feat.vercel.app',
      }).toString()
    ).toBe('https://treid-git-feat.vercel.app/')
  })

  test('falls back to the local dev server', () => {
    expect(getAppUrl({}).toString()).toBe('http://localhost:3000/')
    expect(getAppUrl({ PORT: '3100' }).toString()).toBe(
      'http://localhost:3100/'
    )
  })

  test('skips non-http schemes and a malformed port', () => {
    expect(
      getAppUrl({
        NEXT_PUBLIC_APP_URL: 'ftp://app.treid.app',
        VERCEL_URL: 'treid-git-feat.vercel.app',
      }).toString()
    ).toBe('https://treid-git-feat.vercel.app/')
    expect(getAppUrl({ PORT: 'not-a-port' }).toString()).toBe(
      'http://localhost:3000/'
    )
  })
})
