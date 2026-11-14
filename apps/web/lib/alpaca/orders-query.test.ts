import { expect, test } from 'bun:test'

import { parseOrdersQuery } from './orders-query'

test('applies defaults for absent query parameters', () => {
  const result = parseOrdersQuery(new URLSearchParams())
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).toMatchObject({
      direction: 'desc',
      limit: 500,
      nested: false,
      status: 'all',
    })
  }
})

test('parses pagination and rejects invalid limits', () => {
  const result = parseOrdersQuery(
    new URLSearchParams('beforeOrderId=abc&limit=25&nested=true')
  )
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).toMatchObject({
      beforeOrderId: 'abc',
      limit: 25,
      nested: true,
    })
  }
  expect(parseOrdersQuery(new URLSearchParams('limit=501')).success).toBe(false)
})
