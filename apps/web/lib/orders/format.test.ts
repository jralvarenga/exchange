import { describe, expect, test } from 'bun:test'

import type { AccountOrder } from '@/lib/alpaca/schemas'
import { formatOrderAmount, formatOrderTime } from '@/lib/orders/format'

/** Builds a minimal order for amount and time formatting tests. */
function order(overrides: Partial<AccountOrder> = {}): AccountOrder {
  return {
    clientOrderId: 'client-1',
    id: 'order-1',
    side: 'buy',
    status: 'new',
    submittedAt: '2026-01-15T14:30:00.000Z',
    symbol: 'AAPL',
    timeInForce: 'day',
    type: 'market',
    ...overrides,
  }
}

describe('formatOrderAmount', () => {
  test('shows a partial fill as filled over requested', () => {
    expect(
      formatOrderAmount(
        order({
          filledQuantity: '2',
          quantity: '10',
          status: 'partially_filled',
        })
      )
    ).toBe('2 / 10')
  })

  test('shows the filled quantity once the order is filled', () => {
    expect(
      formatOrderAmount(
        order({ filledQuantity: '5', quantity: '5', status: 'filled' })
      )
    ).toBe('5')
  })

  test('falls back to the requested quantity before any fill', () => {
    expect(formatOrderAmount(order({ quantity: '1.25' }))).toBe('1.25')
  })

  test('keeps small crypto quantities instead of rounding them to zero', () => {
    expect(formatOrderAmount(order({ quantity: '0.00001234' }))).toBe(
      '0.00001234'
    )
  })

  test('formats a notional order as currency', () => {
    expect(formatOrderAmount(order({ notional: '250' }))).toBe('$250.00')
  })
})

describe('formatOrderTime', () => {
  test('uses the unavailable fallback when no time was submitted', () => {
    expect(formatOrderTime(null)).toBe('Not submitted')
  })

  test('uses the unavailable fallback for a malformed timestamp', () => {
    expect(formatOrderTime('not-a-date')).toBe('Not submitted')
  })
})
