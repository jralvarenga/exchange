import { describe, expect, test } from 'bun:test'
import { hash } from 'bcryptjs'
import { hashPassword } from 'better-auth/crypto'

import { verifyStoredPassword } from './password'

describe('verifyStoredPassword', () => {
  test('accepts a bcrypt hash from the previous dashboard login', async () => {
    const passwordHash = await hash('correct horse battery', 4)

    expect(
      await verifyStoredPassword({
        hash: passwordHash,
        password: 'correct horse battery',
      })
    ).toBe(true)
    expect(
      await verifyStoredPassword({
        hash: passwordHash,
        password: 'wrong password',
      })
    ).toBe(false)
  })

  test('accepts a Better Auth scrypt hash', async () => {
    const passwordHash = await hashPassword('correct horse battery')

    expect(passwordHash.startsWith('$2')).toBe(false)
    expect(
      await verifyStoredPassword({
        hash: passwordHash,
        password: 'correct horse battery',
      })
    ).toBe(true)
    expect(
      await verifyStoredPassword({
        hash: passwordHash,
        password: 'wrong password',
      })
    ).toBe(false)
  })
})
