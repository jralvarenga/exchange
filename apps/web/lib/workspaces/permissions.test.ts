import { describe, expect, test } from 'bun:test'

import {
  canLeaveWorkspace,
  canManageWorkspace,
  canTrade,
} from '@/lib/workspaces/permissions'

describe('workspace permissions', () => {
  test('only owners manage the workspace', () => {
    expect(canManageWorkspace('owner')).toBe(true)
    expect(canManageWorkspace('member')).toBe(false)
  })

  test('members trade on paper only', () => {
    expect(canTrade({ environment: 'paper', role: 'member' })).toBe(true)
    expect(canTrade({ environment: 'live', role: 'member' })).toBe(false)
    expect(canTrade({ environment: 'live', role: 'owner' })).toBe(true)
  })

  test('the last owner cannot leave', () => {
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'owner' })).toBe(false)
    expect(canLeaveWorkspace({ ownerCount: 2, role: 'owner' })).toBe(true)
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'member' })).toBe(true)
  })
})
