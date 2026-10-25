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
import { resolveAuthBaseURL, resolveAuthTrustedOrigins } from './origins'
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
    baseURL: resolveAuthBaseURL(process.env),
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
    trustedOrigins: resolveAuthTrustedOrigins(process.env),
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

/** Escapes a URL before it is placed in an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
