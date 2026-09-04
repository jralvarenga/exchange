'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { verifyDashboardPassword } from '@/lib/auth/password'
import { clearLoginAttempts, consumeLoginAttempt } from '@/lib/auth/rate-limit'
import { createSession, deleteSession } from '@/lib/auth/session'

interface LoginState {
  message?: string
  passwordInvalid?: boolean
}

const loginSchema = z.object({
  password: z.string().min(1).max(256),
})

/** Resolves the reverse proxy's client address for login throttling. */
async function getClientIdentifier(): Promise<string> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')

  if (forwardedFor) {
    // Trust only the proxy-provided X-Forwarded-For header and use the
    // left-most value, which represents the original client address.
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return 'unknown'
}

/** Verifies the deploy password and starts a signed dashboard session. */
export async function login(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = await getClientIdentifier()
  const rateLimit = consumeLoginAttempt(identifier)

  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60)

    return {
      message: `Too many attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    }
  }

  const input = loginSchema.safeParse({ password: formData.get('password') })

  if (!input.success) {
    return {
      message: 'Enter the dashboard password to continue.',
      passwordInvalid: true,
    }
  }

  try {
    const passwordMatches = await verifyDashboardPassword(input.data.password)

    if (!passwordMatches) {
      return {
        message: 'That password did not match. Check it and try again.',
        passwordInvalid: true,
      }
    }

    clearLoginAttempts(identifier)
    await createSession()
  } catch (error) {
    console.error(
      'Dashboard authentication is not configured correctly.',
      error
    )

    return {
      message: 'Sign-in is unavailable. Check the server configuration.',
    }
  }

  redirect('/')
}

/** Ends the current dashboard session and returns to the login screen. */
export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
