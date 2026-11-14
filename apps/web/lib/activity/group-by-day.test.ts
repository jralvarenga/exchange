import { describe, expect, test } from 'bun:test'

import {
  formatActivityClock,
  groupActivitiesByDay,
} from '@/lib/activity/group-by-day'
import type { AccountActivity } from '@/lib/alpaca/schemas'

/** Builds an activity with an overrideable time and type. */
function activity(overrides: Partial<AccountActivity>): AccountActivity {
  return { activityType: 'FILL', id: crypto.randomUUID(), ...overrides }
}

describe('groupActivitiesByDay', () => {
  const now = new Date(2026, 10, 13, 15, 0)

  test('labels today, yesterday, this year and older days', () => {
    const days = groupActivitiesByDay({
      activities: [
        activity({ transactionTime: new Date(2026, 10, 13, 10).toISOString() }),
        activity({ transactionTime: new Date(2026, 10, 13, 9).toISOString() }),
        activity({ activityType: 'DIV', date: '2026-11-12' }),
        activity({ transactionTime: new Date(2026, 9, 2, 9).toISOString() }),
        activity({ activityType: 'CSD', date: '2025-03-04' }),
      ],
      now,
    })

    expect(days.map((day) => [day.label, day.activities.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
      ['Friday, October 2', 1],
      ['March 4, 2025', 1],
    ])
  })

  test('keeps activity with no time in its own group', () => {
    expect(
      groupActivitiesByDay({ activities: [activity({})], now })[0]?.label
    ).toBe('Date unavailable')
  })
})

describe('formatActivityClock', () => {
  test('has no clock time for a date-only activity', () => {
    expect(formatActivityClock(activity({ date: '2026-11-12' }))).toBe(
      undefined
    )
  })
})
