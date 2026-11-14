import { expect, test } from 'bun:test'

import { getActivityKind } from '@/lib/activity/activity-kind'

test('inherited property codes use the unknown activity fallback', () => {
  expect(getActivityKind({ activityType: 'constructor', id: 'a' })).toEqual({
    kind: 'other',
    label: 'Constructor',
  })
  expect(getActivityKind({ activityType: 'toString', id: 'b' })).toEqual({
    kind: 'other',
    label: 'Tostring',
  })
})
