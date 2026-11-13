import { describe, expect, test } from 'bun:test'

import {
  canAssignRole,
  canDeleteWorkspace,
  canLeaveWorkspace,
  canManageWorkspace,
  canRemoveMember,
  canTestConnection,
  tradeLock,
} from '@/lib/workspaces/permissions'

describe('workspace permissions', () => {
  test('owners and admins manage the workspace', () => {
    expect(canManageWorkspace('owner')).toBe(true)
    expect(canManageWorkspace('admin')).toBe(true)
    expect(canManageWorkspace('member')).toBe(false)
    expect(canManageWorkspace('paper_trader')).toBe(false)
    expect(canManageWorkspace('viewer')).toBe(false)
  })

  test('only owners delete the workspace', () => {
    expect(canDeleteWorkspace('owner')).toBe(true)
    expect(canDeleteWorkspace('admin')).toBe(false)
  })

  test('admins cannot grant, change or remove the owner role', () => {
    expect(canAssignRole({ actor: 'owner', from: 'admin', to: 'owner' })).toBe(
      true
    )
    expect(canAssignRole({ actor: 'admin', from: 'member', to: 'admin' })).toBe(
      true
    )
    expect(canAssignRole({ actor: 'admin', to: 'owner' })).toBe(false)
    expect(canAssignRole({ actor: 'admin', from: 'owner', to: 'admin' })).toBe(
      false
    )
    expect(canAssignRole({ actor: 'member', to: 'viewer' })).toBe(false)
    expect(canRemoveMember({ actor: 'admin', target: 'owner' })).toBe(false)
    expect(canRemoveMember({ actor: 'admin', target: 'admin' })).toBe(true)
    expect(canRemoveMember({ actor: 'owner', target: 'owner' })).toBe(true)
  })

  test('paper traders trade on paper only, viewers never', () => {
    expect(tradeLock({ environment: 'live', role: 'owner' })).toBeNull()
    expect(tradeLock({ environment: 'live', role: 'admin' })).toBeNull()
    expect(tradeLock({ environment: 'live', role: 'member' })).toBeNull()
    expect(tradeLock({ environment: 'paper', role: 'paper_trader' })).toBeNull()
    expect(tradeLock({ environment: 'live', role: 'paper_trader' })).toBe(
      'paper_only'
    )
    expect(tradeLock({ environment: 'paper', role: 'viewer' })).toBe('viewer')
  })

  test('everyone but viewers tests connections', () => {
    expect(canTestConnection('paper_trader')).toBe(true)
    expect(canTestConnection('viewer')).toBe(false)
  })

  test('the last owner cannot leave', () => {
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'owner' })).toBe(false)
    expect(canLeaveWorkspace({ ownerCount: 2, role: 'owner' })).toBe(true)
    expect(canLeaveWorkspace({ ownerCount: 1, role: 'admin' })).toBe(true)
  })
})
