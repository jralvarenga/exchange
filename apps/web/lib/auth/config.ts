const MINIMUM_AUTH_SECRET_LENGTH = 32

/** Returns the configured bcrypt password hash or throws on unsafe configuration. */
export function getDashboardPasswordHash(): string {
  const passwordHash = process.env.DASHBOARD_PASSWORD_HASH

  // Accept only valid bcrypt identifiers ($2a/$2b/$2y), a two-digit cost (04–31),
  // and a 53-character base64 payload (22-char salt + 31-char hash).
  const BCRYPT_REGEX =
    /^\$(2[aby])\$(0[4-9]|[12][0-9]|3[0-1])\$[./A-Za-z0-9]{53}$/

  if (!passwordHash || !BCRYPT_REGEX.test(passwordHash)) {
    throw new Error(
      'DASHBOARD_PASSWORD_HASH must be a valid bcrypt hash (e.g. $2b$12$...). In .env files, escape each $ as \\$ or rerun `bun run auth:setup`.'
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
