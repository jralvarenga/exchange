'use client'

import { authClient } from '@workspace/auth/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const verifyEmailRequests = new Map<
  string,
  ReturnType<typeof authClient.verifyEmail>
>()

/** Reuses one in-flight verification so Strict Mode cannot consume the token twice. */
function verifyEmailToken(
  token: string
): ReturnType<typeof authClient.verifyEmail> {
  const existing = verifyEmailRequests.get(token)

  if (existing) {
    return existing
  }

  const request = authClient.verifyEmail({
    query: {
      token,
    },
  })
  verifyEmailRequests.set(token, request)

  return request
}

/** Confirms the address from the verification email and opens the dashboard. */
export function VerifyEmailStatus() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [message, setMessage] = useState(
    token
      ? 'Confirming your email…'
      : 'This verification link is missing a token.'
  )

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    async function confirmEmail(): Promise<void> {
      try {
        const result = await verifyEmailToken(token)

        if (cancelled) {
          return
        }

        if (result.error) {
          setMessage(
            result.error.message ?? 'This verification link could not be used.'
          )
          return
        }

        router.push('/')
        router.refresh()
      } catch {
        if (cancelled) {
          return
        }

        setMessage('This verification link could not be used.')
      }
    }

    void confirmEmail()

    return () => {
      cancelled = true
    }
  }, [router, token])

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="font-bold text-xl">Email verification</h1>
      <p role="status">{message}</p>
      <Link href="/login" className="underline underline-offset-4">
        Back to login
      </Link>
    </div>
  )
}
