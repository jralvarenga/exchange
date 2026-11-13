'use client'

import { authClient } from '@workspace/auth/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UseSignOutResult {
  pending: boolean
  signOut: () => Promise<void>
}

interface UseSignOutOptions {
  /** A same-site path to return to after signing in again, such as an invite link. */
  next?: string
}

/** Ends the Better Auth session and returns to the login page. */
export function useSignOut(options: UseSignOutOptions = {}): UseSignOutResult {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut(): Promise<void> {
    setPending(true)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        setPending(false)
        return
      }

      router.replace(
        options.next
          ? `/login?next=${encodeURIComponent(options.next)}`
          : '/login'
      )
      router.refresh()
    } catch {
      setPending(false)
    }
  }

  return { pending, signOut }
}
