'use client'

import { authClient } from '@workspace/auth/client'
import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

interface Props {
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

/** Starts the Google OAuth flow and returns the browser to the dashboard. */
export function GoogleSignInButton({ disabled, onBusyChange }: Props) {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)

  async function handleClick(): Promise<void> {
    setPending(true)
    onBusyChange?.(true)
    setMessage(undefined)

    try {
      const result = await authClient.signIn.social({
        callbackURL: '/',
        provider: 'google',
      })

      if (result.error) {
        setMessage(result.error.message ?? 'Google sign-in did not start.')
        setPending(false)
        onBusyChange?.(false)
      }
    } catch {
      setMessage('Google sign-in did not start.')
      setPending(false)
      onBusyChange?.(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending || disabled}
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
