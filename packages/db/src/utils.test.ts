import { describe, expect, test } from 'bun:test'

import { normalizeDatabaseUrl } from './utils'

const host = 'postgresql://user:pass@db.example.com/app'

describe('normalizeDatabaseUrl', () => {
  test.each(['prefer', 'require', 'verify-ca'])(
    'rewrites sslmode=%s to verify-full',
    (mode) => {
      expect(normalizeDatabaseUrl(`${host}?sslmode=${mode}`)).toBe(
        `${host}?sslmode=verify-full`
      )
    }
  )

  test('keeps other parameters around the SSL mode', () => {
    expect(
      normalizeDatabaseUrl(
        `${host}?channel_binding=require&sslmode=require&application_name=web`
      )
    ).toBe(
      `${host}?channel_binding=require&sslmode=verify-full&application_name=web`
    )
  })

  test('leaves URLs without an SSL mode unchanged', () => {
    const local = 'postgresql://exchange:exchange@127.0.0.1:5432/exchange'

    expect(normalizeDatabaseUrl(local)).toBe(local)
  })

  test.each(['disable', 'verify-full', 'no-verify'])(
    'leaves sslmode=%s unchanged',
    (mode) => {
      const url = `${host}?sslmode=${mode}`

      expect(normalizeDatabaseUrl(url)).toBe(url)
    }
  )

  test('leaves URLs that opt into libpq compatibility unchanged', () => {
    const url = `${host}?uselibpqcompat=true&sslmode=require`

    expect(normalizeDatabaseUrl(url)).toBe(url)
  })

  test('does not touch other parameters that end in sslmode', () => {
    const url = `${host}?channel_binding=require&xsslmode=require`

    expect(normalizeDatabaseUrl(url)).toBe(url)
  })
})
