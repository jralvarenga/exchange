'use client'

import { authClient } from '@workspace/auth/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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

    let active = true

    async function confirmEmail(): Promise<void> {
      const result = await authClient.verifyEmail({
        query: {
          token,
        },
      })

      if (!active) {
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
    }

    void confirmEmail()

    return () => {
      active = false
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
