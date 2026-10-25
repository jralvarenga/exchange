'use client'

import { authClient } from '@workspace/auth/client'
import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

/** Starts the Google OAuth flow and returns the browser to the dashboard. */
export function GoogleSignInButton() {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  async function handleClick(): Promise<void> {
    setPending(true)
    setMessage(undefined)
    const result = await authClient.signIn.social({
      callbackURL: '/',
      provider: 'google',
    })

    if (result.error) {
      setMessage(result.error.message ?? 'Google sign-in did not start.')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => {
          void handleClick()
        }}
      >
        Continue with Google
      </Button>
      {message ? (
        <p role="alert" className="text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  )
}
