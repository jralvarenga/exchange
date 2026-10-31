import { mock } from 'bun:test'

mock.module('server-only', () => ({}))

const { describe, expect, test } = await import('bun:test')
const { AlpacaApiError, toOptionalNumber } = await import('./client')
const { getMarketSnapshot, getOptionChain, getOrderbook } = await import(
  './market-data'
)

interface ClientOptions {
  fetcher: typeof fetch
}

const clientOptions = {
  apiKeyId: 'key',
  apiSecretKey: 'secret',
  cryptoLocation: 'us' as const,
  dataBaseUrl: 'https://data.example.test',
  environment: 'paper' as const,
}

/** Builds a JSON response for the fake Alpaca fetcher. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

/** Reads the URL passed to a fetch-compatible fake. */
function requestUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) {
    return input
  }

  if (typeof input === 'string') {
    return new URL(input)
  }

  return new URL(input.url)
}

/** Returns client options whose fetcher is supplied by the test. */
function withFetcher(
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): ClientOptions & typeof clientOptions {
  return { ...clientOptions, fetcher: fetcher as typeof fetch }
}

describe('toOptionalNumber', () => {
  test('returns undefined for blank and non-finite values', () => {
    expect(toOptionalNumber(undefined)).toBeUndefined()
    expect(toOptionalNumber(null)).toBeUndefined()
    expect(toOptionalNumber('')).toBeUndefined()
    expect(toOptionalNumber('nope')).toBeUndefined()
    expect(toOptionalNumber('Infinity')).toBeUndefined()
  })

  test('parses finite decimal strings, including zero', () => {
    expect(toOptionalNumber('0')).toBe(0)
    expect(toOptionalNumber('1.5')).toBe(1.5)
  })
})

describe('getOrderbook', () => {
  test('throws when the requested symbol is absent', async () => {
    const orderbook = getOrderbook({
      ...withFetcher(async () =>
        jsonResponse({
          orderbooks: {
            'ETH/USD': { a: [], b: [], t: '2026-10-31T00:00:00Z' },
          },
        })
      ),
      symbol: 'BTC/USD',
    })

    await expect(orderbook).rejects.toBeInstanceOf(AlpacaApiError)
    await expect(orderbook).rejects.toMatchObject({ status: 404 })
  })

  test('returns an empty book when the book object is present', async () => {
    const book = await getOrderbook({
      ...withFetcher(async () =>
        jsonResponse({
          orderbooks: {
            'BTC/USD': { a: [], b: [], t: '2026-10-31T00:00:00Z' },
          },
        })
      ),
      symbol: 'BTC/USD',
    })

    expect(book).toEqual({
      asks: [],
      bids: [],
      symbol: 'BTC/USD',
      timestamp: '2026-10-31T00:00:00Z',
    })
  })

  test('matches an order book whose key differs only by case', async () => {
    const book = await getOrderbook({
      ...withFetcher(async () =>
        jsonResponse({
          orderbooks: {
            'BTC/USD': {
              a: [{ p: 2, s: 1 }],
              b: [{ p: 1, s: 3 }],
              t: '2026-10-31T00:00:00Z',
            },
          },
        })
      ),
      symbol: 'btc/usd',
    })

    expect(book.bids).toEqual([{ price: 1, size: 3 }])
    expect(book.symbol).toBe('btc/usd')
  })
})

describe('getMarketSnapshot', () => {
  test('looks up a lowercase crypto pair with an uppercase key', async () => {
    const requestedSymbols: string[] = []
    const snapshot = await getMarketSnapshot({
      ...withFetcher(async (input) => {
        requestedSymbols.push(
          requestUrl(input).searchParams.get('symbols') ?? ''
        )

        return jsonResponse({
          snapshots: {
            'BTC/USD': {
              latestTrade: { p: 100, s: 1, t: '2026-10-31T00:00:00Z' },
            },
          },
        })
      }),
      symbol: 'btc/usd',
    })

    expect(requestedSymbols).toEqual(['BTC/USD'])
    expect(snapshot.symbol).toBe('BTC/USD')
    expect(snapshot.lastPrice).toBe(100)
  })

  test('uppercases a stock symbol in the snapshot path', async () => {
    const paths: string[] = []
    const snapshot = await getMarketSnapshot({
      ...withFetcher(async (input) => {
        paths.push(requestUrl(input).pathname)

        return jsonResponse({
          latestTrade: { p: 10, s: 1, t: '2026-10-31T00:00:00Z' },
        })
      }),
      symbol: 'aapl',
    })

    expect(paths).toEqual(['/v2/stocks/AAPL/snapshot'])
    expect(snapshot.symbol).toBe('AAPL')
    expect(snapshot.lastPrice).toBe(10)
  })
})

describe('getOptionChain', () => {
  test('follows next_page_token for contracts and snapshots', async () => {
    const urls: URL[] = []
    const chain = await getOptionChain({
      ...withFetcher(async (input) => {
        const url = requestUrl(input)
        urls.push(url)

        if (url.pathname === '/v2/options/contracts') {
          if (url.searchParams.get('page_token') === 'contracts-2') {
            return jsonResponse({
              next_page_token: null,
              option_contracts: [
                contract('AAPL270115C00090000', '2027-01-15', 'call', '90'),
                contract('AAPL270115P00090000', '2027-01-15', 'put', '90'),
              ],
            })
          }

          return jsonResponse({
            next_page_token: 'contracts-2',
            option_contracts: [
              contract('AAPL270618C00100000', '2027-06-18', 'call', '100'),
            ],
          })
        }

        if (url.searchParams.get('page_token') === 'snapshots-2') {
          return jsonResponse({
            next_page_token: null,
            snapshots: {
              AAPL270115P00090000: {
                latestQuote: quote(2.5),
              },
            },
          })
        }

        return jsonResponse({
          next_page_token: 'snapshots-2',
          snapshots: {
            AAPL270115C00090000: {
              latestQuote: quote(1.5),
            },
          },
        })
      }),
      underlying: 'aapl',
    })

    expect(chain.expirations).toEqual(['2027-01-15', '2027-06-18'])
    expect(chain.calls[0]?.askPrice).toBe(1.5)
    expect(chain.puts[0]?.askPrice).toBe(2.5)
    expect(
      urls.some(
        (url) =>
          url.pathname === '/v2/options/contracts' &&
          url.searchParams.get('page_token') === 'contracts-2'
      )
    ).toBe(true)
    expect(
      urls.some((url) => url.searchParams.get('page_token') === 'snapshots-2')
    ).toBe(true)
  })

  test('throws when option pages stay truncated at the page cap', async () => {
    let calls = 0
    const chain = getOptionChain({
      ...withFetcher(async () => {
        calls += 1

        return jsonResponse({
          next_page_token: 'again',
          option_contracts: [
            contract('AAPL270115C00090000', '2027-01-15', 'call', '90'),
          ],
        })
      }),
      underlying: 'AAPL',
    })

    await expect(chain).rejects.toMatchObject({
      message: 'Option data exceeded the pagination limit.',
      status: 502,
    })
    expect(calls).toBe(20)
  })

  test('propagates snapshot failures instead of returning empty quotes', async () => {
    const chain = getOptionChain({
      ...withFetcher(async (input) => {
        const url = requestUrl(input)

        if (url.pathname === '/v2/options/contracts') {
          return jsonResponse({
            next_page_token: null,
            option_contracts: [
              contract('AAPL270115C00090000', '2027-01-15', 'call', '90'),
            ],
          })
        }

        return jsonResponse({ message: 'unavailable' }, 503)
      }),
      underlying: 'AAPL',
    })

    await expect(chain).rejects.toBeInstanceOf(AlpacaApiError)
    await expect(chain).rejects.toMatchObject({ status: 503 })
  })
})

/** Builds an option contract fixture. */
function contract(
  symbol: string,
  expiration: string,
  type: 'call' | 'put',
  strike: string
) {
  return {
    expiration_date: expiration,
    id: symbol,
    strike_price: strike,
    symbol,
    tradable: true,
    type,
    underlying_symbol: 'AAPL',
  }
}

/** Builds a quote fixture with the fields the snapshot schema requires. */
function quote(ask: number) {
  return {
    ap: ask,
    as: 1,
    bp: ask - 0.1,
    bs: 1,
    t: '2026-10-31T00:00:00Z',
  }
}
