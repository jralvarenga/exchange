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
    expect(canManageWorkspace('viewer')).toBe(false)
  })

  test('owners and members trade, viewers only look', () => {
    expect(canTrade('owner')).toBe(true)
    expect(canTrade('member')).toBe(true)
    expect(canTrade('viewer')).toBe(false)
  })

  test('the last owner cannot leave', () => {
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'owner' })).toBe(false)
    expect(canLeaveWorkspace({ ownerCount: 2, role: 'owner' })).toBe(true)
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'member' })).toBe(true)
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'viewer' })).toBe(true)
  })
})
