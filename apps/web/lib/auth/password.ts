import { compare, getRounds } from 'bcryptjs'

import { getDashboardPasswordHash } from '@/lib/auth/config'

const MINIMUM_BCRYPT_COST = 12

/** Verifies a password against the deploy hash after enforcing its work factor. */
export async function verifyDashboardPassword(
  password: string
): Promise<boolean> {
  const passwordHash = getDashboardPasswordHash()

  if (getRounds(passwordHash) < MINIMUM_BCRYPT_COST) {
    throw new Error(
      `DASHBOARD_PASSWORD_HASH must use bcrypt cost ${MINIMUM_BCRYPT_COST} or higher`
    )
  }

  return compare(password, passwordHash)
}
