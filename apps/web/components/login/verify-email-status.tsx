'use client'

import { authClient } from '@workspace/auth/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const requestedTokens = new Set<string>()

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
    if (!token || requestedTokens.has(token)) {
      return
    }

    requestedTokens.add(token)

    async function confirmEmail(): Promise<void> {
      try {
        const result = await authClient.verifyEmail({
          query: {
            token,
          },
        })

        if (result.error) {
          setMessage(
            result.error.message ?? 'This verification link could not be used.'
          )
          return
        }

        router.push('/')
        router.refresh()
      } catch {
        setMessage('This verification link could not be used.')
      }
    }

    void confirmEmail()
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
