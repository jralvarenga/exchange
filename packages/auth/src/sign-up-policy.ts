export interface SignUpPolicy {
  allowedEmails: readonly string[] | undefined
  disableSignUp: boolean
}

/**
 * Reads AUTH_ALLOWED_EMAILS and AUTH_DISABLE_SIGNUP.
 * A non-empty allowlist wins in every environment. Otherwise the disable flag
 * applies, and Vercel production (or NODE_ENV=production when VERCEL_ENV is
 * unset) stays closed when both are unset. Preview deploys stay open.
 */
export function resolveSignUpPolicy(
  source: Record<string, string | undefined>
): SignUpPolicy {
  const allowedEmails = parseAllowedEmails(source.AUTH_ALLOWED_EMAILS)

  if (allowedEmails) {
    return {
      allowedEmails,
      disableSignUp: false,
    }
  }

  if (isEnvFlagTrue(source.AUTH_DISABLE_SIGNUP)) {
    return {
      allowedEmails: undefined,
      disableSignUp: true,
    }
  }

  if (isEnvFlagFalse(source.AUTH_DISABLE_SIGNUP)) {
    return {
      allowedEmails: undefined,
      disableSignUp: false,
    }
  }

  return {
    allowedEmails: undefined,
    disableSignUp: isProductionEnv(source),
  }
}

/**
 * True when this address may create a new user through email or Google.
 * Existing users can still sign in when this returns false.
 */
export function isSignUpEmailAllowed(
  email: string,
  source: Record<string, string | undefined>
): boolean {
  const policy = resolveSignUpPolicy(source)

  if (policy.disableSignUp) {
    return false
  }

  if (!policy.allowedEmails) {
    return true
  }

  return policy.allowedEmails.includes(normalizeEmail(email))
}

/** Splits a comma-separated allowlist into lowercase addresses. */
function parseAllowedEmails(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined
  }

  const emails = value
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => entry.length > 0)

  return emails.length > 0 ? emails : undefined
}

/**
 * True for Vercel production, or for NODE_ENV=production when VERCEL_ENV is unset.
 * Preview and development Vercel deploys stay out of this default even though
 * Next.js sets NODE_ENV=production there.
 */
function isProductionEnv(source: Record<string, string | undefined>): boolean {
  if (source.VERCEL_ENV) {
    return source.VERCEL_ENV === 'production'
  }

  return source.NODE_ENV === 'production'
}

/** Accepts a trimmed mailbox and stores it in lowercase. */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/** True for `true` or `1`. */
function isEnvFlagTrue(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()

  return normalized === 'true' || normalized === '1'
}

/** True for `false` or `0`. */
function isEnvFlagFalse(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()

  return normalized === 'false' || normalized === '0'
}
