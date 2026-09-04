import { afterEach, describe, expect, test } from 'bun:test'
import { hash } from 'bcryptjs'

import { verifyDashboardPassword } from './password'

const ORIGINAL_PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH

afterEach(() => {
  process.env.DASHBOARD_PASSWORD_HASH = ORIGINAL_PASSWORD_HASH
})

describe('dashboard password', () => {
  test('accepts the password represented by the deploy hash', async () => {
    process.env.DASHBOARD_PASSWORD_HASH = await hash(
      'correct horse battery',
      12
    )

    expect(await verifyDashboardPassword('correct horse battery')).toBe(true)
    expect(await verifyDashboardPassword('wrong password')).toBe(false)
  })

  test('rejects a weak bcrypt work factor', async () => {
    process.env.DASHBOARD_PASSWORD_HASH = await hash('password', 4)

    expect(verifyDashboardPassword('password')).rejects.toThrow(
      'bcrypt cost 12 or higher'
    )
  })
})
