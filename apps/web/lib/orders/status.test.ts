import { describe, expect, test } from 'bun:test'

import { getOrderStatus, getOrdersApiStatus } from '@/lib/orders/status'

describe('getOrderStatus', () => {
  test('marks filled orders with the filled tone', () => {
    expect(getOrderStatus('filled')).toEqual({
      isCancelable: false,
      label: 'Filled',
      tone: 'filled',
    })
  })

  test('marks working orders as open and cancelable', () => {
    expect(getOrderStatus('new')).toEqual({
      isCancelable: true,
      label: 'New',
      tone: 'open',
    })
    expect(getOrderStatus('partially_filled').isCancelable).toBe(true)
    expect(getOrderStatus('partially_filled').tone).toBe('open')
  })

  test('keeps pending_cancel in Open without a cancel action', () => {
    expect(getOrderStatus('pending_cancel')).toEqual({
      isCancelable: false,
      label: 'Pending cancel',
      tone: 'open',
    })
  })

  test('keeps pending_replace in Open without a cancel action', () => {
    expect(getOrderStatus('pending_replace')).toEqual({
      isCancelable: false,
      label: 'Pending replace',
      tone: 'open',
    })
  })

  test('treats done_for_day as open and cancelable', () => {
    expect(getOrderStatus('done_for_day')).toEqual({
      isCancelable: true,
      label: 'Done for day',
      tone: 'open',
    })
  })

  test('marks terminal statuses as closed', () => {
    expect(getOrderStatus('canceled')).toEqual({
      isCancelable: false,
      label: 'Canceled',
      tone: 'closed',
    })
    expect(getOrderStatus('expired').tone).toBe('closed')
    expect(getOrderStatus('replaced').isCancelable).toBe(false)
  })
})

describe('getOrdersApiStatus', () => {
  test('maps home pills onto Alpaca list statuses', () => {
    expect(getOrdersApiStatus('all')).toBe('all')
    expect(getOrdersApiStatus('open')).toBe('open')
    expect(getOrdersApiStatus('filled')).toBe('closed')
    expect(getOrdersApiStatus('closed')).toBe('closed')
  })
})
