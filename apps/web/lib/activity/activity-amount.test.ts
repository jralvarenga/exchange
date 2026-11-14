import { describe, expect, test } from 'bun:test'

import { getActivityAmount } from '@/lib/activity/activity-amount'

describe('getActivityAmount', () => {
  test('totals a fill and shows how', () => {
    expect(
      getActivityAmount({
        activityType: 'FILL',
        id: 'a',
        price: '150.5',
        quantity: '2',
      })
    ).toEqual({ primary: '$301.00', secondary: '2 × $150.50' })
  })

  test('signs the net amount of cash activity', () => {
    expect(
      getActivityAmount({ activityType: 'DIV', id: 'b', netAmount: '4.2' })
        .primary
    ).toBe('+$4.20')
  })

  test('falls back to a dash when nothing is known', () => {
    expect(getActivityAmount({ activityType: 'MISC', id: 'c' }).primary).toBe(
      '—'
    )
  })
})
