const MINIMUM_AUTH_SECRET_LENGTH = 32

/** Returns the configured bcrypt password hash or throws on unsafe configuration. */
export function getDashboardPasswordHash(): string {
  const passwordHash = process.env.DASHBOARD_PASSWORD_HASH

  if (!passwordHash?.startsWith('$2')) {
    throw new Error(
      'DASHBOARD_PASSWORD_HASH must be a bcrypt hash. In .env files, escape every $ as \\$ or rerun `bun run auth:setup`.'
    )
  }

  return passwordHash
}

/** Returns the session signing secret or throws when it is too short. */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET

  if (!secret || secret.length < MINIMUM_AUTH_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET must contain at least ${MINIMUM_AUTH_SECRET_LENGTH} characters`
    )
  }

  return secret
}
