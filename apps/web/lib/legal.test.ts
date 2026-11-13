import { describe, expect, test } from 'bun:test'

import { getLegalLinks } from './legal'

describe('getLegalLinks', () => {
  const expected = {
    privacy: 'http://127.0.0.1:4321/privacy',
    terms: 'http://127.0.0.1:4321/terms',
  }

  test('falls back to the local landing dev server when unset or blank', () => {
    expect(getLegalLinks(undefined)).toEqual(expected)
    expect(getLegalLinks('')).toEqual(expected)
    expect(getLegalLinks('   ')).toEqual(expected)
  })

  test('falls back to the local landing dev server when the URL is invalid', () => {
    expect(getLegalLinks('exchange.example.com')).toEqual(expected)
  })

  test('builds the legal pages on the configured landing origin', () => {
    expect(getLegalLinks(' https://exchange.example.com/ ')).toEqual({
      privacy: 'https://exchange.example.com/privacy',
      terms: 'https://exchange.example.com/terms',
    })
  })
})
