import { db } from '@workspace/db/client'
import {
  accounts,
  rateLimits,
  sessions,
  users,
  verifications,
} from '@workspace/db/schema/auth'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { sendAuthEmail } from './email'
import { verifyStoredPassword } from './password'

/**
 * Builds the Better Auth server.
 * Google and password sign-ins with the same verified email join one user.
 * New passwords use Better Auth's scrypt hash. Existing bcrypt hashes still verify.
 */
function createAuth() {
  return betterAuth({
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    advanced: {
      useSecureCookies: true,
    },
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        accounts,
        rateLimits,
        sessions,
        users,
        verifications,
      },
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
      password: {
        verify: verifyStoredPassword,
      },
      requireEmailVerification: true,
      sendResetPassword: async function sendResetPassword({ url, user }) {
        // Do not await delivery. Existing addresses would otherwise take
        // longer than unknown ones and leak whether the account exists.
        void sendAuthEmail({
          html: `<p>Reset the password for your Exchange account.</p><p><a href="${escapeHtml(url)}">Choose a new password</a></p>`,
          subject: 'Reset your Exchange password',
          text: `Reset your Exchange password: ${url}`,
          to: user.email,
        }).catch(() => undefined)
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignUp: true,
      sendVerificationEmail: async function sendVerificationEmail({
        url,
        user,
      }) {
        await sendAuthEmail({
          html: `<p>Confirm this address to finish creating your Exchange account.</p><p><a href="${escapeHtml(url)}">Verify email</a></p>`,
          subject: 'Verify your Exchange email',
          text: `Verify your Exchange email: ${url}`,
          to: user.email,
        })
      },
    },
    plugins: [nextCookies()],
    rateLimit: {
      customRules: {
        '/sign-in/email': {
          max: 5,
          window: 900,
        },
      },
      enabled: true,
      storage: 'database',
    },
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
    },
    trustedOrigins: authTrustedOrigins(),
    user: {
      additionalFields: {
        activeAlpacaEnvironment: {
          defaultValue: 'paper',
          input: false,
          required: true,
          type: ['paper', 'live'],
        },
      },
    },
  })
}

type Auth = ReturnType<typeof createAuth>

let authInstance: Auth | undefined

/** Returns the process-wide Better Auth instance, creating it on first use. */
function getAuth(): Auth {
  if (!authInstance) {
    authInstance = createAuth()
  }

  return authInstance
}

/**
 * Lazy Better Auth handle. Construction waits until a request or the CLI
 * reads it, so environment validation can fail first.
 */
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, property, receiver) {
    const value = Reflect.get(getAuth(), property, receiver)

    if (typeof value === 'function') {
      return value.bind(getAuth())
    }

    return value
  },
  has(_target, property) {
    return property in getAuth()
  },
})

/**
 * Origins allowed for CSRF and OAuth callbacks.
 * BETTER_AUTH_URL is required. Preview hosts can be added with
 * BETTER_AUTH_TRUSTED_ORIGINS or VERCEL_URL.
 */
function authTrustedOrigins(): string[] {
  const origins = new Set<string>()

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL)
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }

  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS

  if (extra) {
    for (const origin of extra.split(',')) {
      const trimmed = origin.trim()

      if (trimmed.length > 0) {
        origins.add(trimmed)
      }
    }
  }

  return [...origins]
}

/** Escapes a URL before it is placed in an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
