import { describe, expect, test } from 'bun:test'

import { formatStaleRefresh, formatUpdatedAt } from '@/lib/utils'

describe('formatStaleRefresh', () => {
  test('keeps last-good values and names when they were taken', () => {
    const timestamp = Date.parse('2026-11-11T15:04:00.000Z')

    expect(formatStaleRefresh({ timestamp })).toBe(
      `Couldn't refresh. Showing values from ${formatUpdatedAt({ timestamp })}.`
    )
  })
})
