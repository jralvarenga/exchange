import { mock } from 'bun:test'

mock.module('server-only', () => ({}))

const { describe, expect, test } = await import('bun:test')
const { serializeWithoutCredentials } = await import('./credential-guard')
const { alpacaFetch, isAlpacaOrigin } = await import('./client')
const { z } = await import('zod')

const alpaca = {
  apiKeyId: 'PKTESTKEY1234',
  apiSecretKey: 'secret-value-5678',
}

describe('serializeWithoutCredentials', () => {
  test('serializes a result without keys', () => {
    expect(serializeWithoutCredentials({ alpaca, data: { cash: 10 } })).toBe(
      '{"cash":10}'
    )
    expect(serializeWithoutCredentials({ alpaca, data: undefined })).toBe(
      'null'
    )
  })

  test('refuses a key that JSON escapes inside the body', () => {
    const escaped = {
      apiKeyId: 'PKTEST',
      apiSecretKey: 'sec"ret\\with\nnewline',
    }

    expect(
      serializeWithoutCredentials({
        alpaca: escaped,
        data: { leaked: escaped.apiSecretKey },
      })
    ).toBeUndefined()
  })

  test('refuses a result that spreads the credentials', () => {
    expect(
      serializeWithoutCredentials({ alpaca, data: { ...alpaca, cash: 10 } })
    ).toBeUndefined()
    expect(
      serializeWithoutCredentials({
        alpaca,
        data: { nested: [{ note: `key ${alpaca.apiKeyId}` }] },
      })
    ).toBeUndefined()
  })
})

describe('Alpaca destinations', () => {
  test('accepts only the https Alpaca origins', () => {
    expect(isAlpacaOrigin(new URL('https://data.alpaca.markets/v2/x'))).toBe(
      true
    )
    expect(isAlpacaOrigin(new URL('https://paper-api.alpaca.markets'))).toBe(
      true
    )
    expect(isAlpacaOrigin(new URL('https://api.alpaca.markets'))).toBe(true)
    expect(isAlpacaOrigin(new URL('http://api.alpaca.markets'))).toBe(false)
    expect(isAlpacaOrigin(new URL('https://alpaca.markets.evil.test'))).toBe(
      false
    )
    expect(isAlpacaOrigin(new URL('https://u:p@api.alpaca.markets'))).toBe(
      false
    )
  })

  test('never sends keys to another host, even through an injected fetcher, and refuses redirects', async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = []
    const fetcher = (async (url: URL | string, init?: RequestInit) => {
      calls.push({ init, url: String(url) })
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    const client = {
      apiKeyId: alpaca.apiKeyId,
      apiSecretKey: alpaca.apiSecretKey,
      cryptoLocation: 'us',
      dataBaseUrl: 'https://data.alpaca.markets',
      fetcher,
      timeoutMs: 1_000,
      tradingBaseUrl: 'https://paper-api.alpaca.markets',
    }

    await expect(
      alpacaFetch({
        baseUrl: 'https://collector.example.test',
        client,
        path: '/v2/account',
        schema: z.unknown(),
      })
    ).rejects.toThrow('Refusing to send Alpaca keys outside Alpaca.')
    expect(calls).toHaveLength(0)

    await alpacaFetch({
      baseUrl: client.tradingBaseUrl,
      client,
      path: '/v2/account',
      schema: z.unknown(),
    })
    expect(calls[0]?.url).toBe('https://paper-api.alpaca.markets/v2/account')
    expect(calls[0]?.init?.redirect).toBe('error')
  })
})
