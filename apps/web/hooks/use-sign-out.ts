'use client'

import { authClient } from '@workspace/auth/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UseSignOutResult {
  pending: boolean
  signOut: () => Promise<void>
}

/** Ends the Better Auth session and returns to the login page. */
export function useSignOut(): UseSignOutResult {
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

      router.replace('/login')
      router.refresh()
    } catch {
      setPending(false)
    }
  }

  return { pending, signOut }
}
