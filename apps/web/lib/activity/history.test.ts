import { describe, expect, test } from 'bun:test'
import type {
  ActivityLogRow,
  OrderEventRow,
  OrderRow,
} from '@workspace/db/queries/activity'

import {
  activityLogToEntry,
  mergeHistory,
  orderEventToEntry,
} from '@/lib/activity/history'

const actor = {
  connectionId: 'c1',
  connectionName: 'Main paper',
  environment: 'paper',
  userId: 'u1',
  workspaceId: 'w1',
}

const order: OrderRow = {
  ...actor,
  alpacaOrderId: 'a1',
  assetClass: 'us_equity',
  clientOrderId: null,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  id: 'o1',
  limitPrice: '150.500',
  notional: null,
  orderClass: 'simple',
  quantity: '10',
  side: 'buy',
  source: 'ticket',
  status: 'new',
  stopPrice: null,
  symbol: 'AAPL',
  timeInForce: 'day',
  type: 'limit',
  updatedAt: new Date('2026-01-01T10:00:00Z'),
}

const placed: OrderEventRow & { order: OrderRow } = {
  ...actor,
  alpacaOrderId: 'a1',
  createdAt: new Date('2026-01-01T10:00:00Z'),
  details: null,
  id: 'e1',
  order,
  orderId: 'o1',
  type: 'placed',
}

describe('workspace history', () => {
  test('describes a placed order with its connection', () => {
    expect(orderEventToEntry(placed)).toMatchObject({
      connectionName: 'Main paper',
      detail: '10 shares · limit · at 150.5',
      environment: 'paper',
      side: 'buy',
      title: 'Buy AAPL',
    })
  })

  test('names a cancel of an order placed outside Treid', () => {
    expect(
      orderEventToEntry({ ...placed, order: null, type: 'canceled' }).title
    ).toBe('Canceled an order')
  })

  test('describes logs and sorts everything newest first', () => {
    const log: ActivityLogRow = {
      ...actor,
      action: 'positions.liquidated',
      createdAt: new Date('2026-01-02T10:00:00Z'),
      id: 'l1',
      metadata: { failed: 1, succeeded: 3 },
      targetId: null,
      targetType: null,
    }
    const merged = mergeHistory(
      [[orderEventToEntry(placed)], [activityLogToEntry(log)]],
      10
    )

    expect(merged.map((entry) => entry.title)).toEqual([
      'Closed all positions',
      'Buy AAPL',
    ])
    expect(merged[0]?.detail).toBe('3 done · 1 failed')
  })
})
