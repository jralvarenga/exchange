'use client'

import { authClient } from '@workspace/auth/client'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  className?: string
}

/** Ends the Better Auth session and returns to the login page. */
export function SignOutButton({ className }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut(): Promise<void> {
    setPending(true)
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      aria-label="Sign out"
      title="Sign out"
      disabled={pending}
      className={className}
      onClick={() => {
        void handleSignOut()
      }}
    >
      <LogOut aria-hidden="true" className="size-5" />
    </button>
  )
}
