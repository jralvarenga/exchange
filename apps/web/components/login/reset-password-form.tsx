'use client'

import { authClient } from '@workspace/auth/client'
import { Button } from '@workspace/ui/components/button'
import { Field, FieldGroup, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  token: string
}

/** Sets a new password from the token in the reset email. */
export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showsPassword, setShowsPassword] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)

    try {
      const result = await authClient.resetPassword({
        newPassword: String(formData.get('password') ?? ''),
        token,
      })

      if (result.error) {
        setMessage(result.error.message ?? 'This reset link could not be used.')
        return
      }

      router.push('/login')
    } catch {
      setMessage('This reset link could not be used.')
    } finally {
      setPending(false)
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-bold text-xl">Reset link missing</h1>
        <p role="alert">Open the link from the reset email and try again.</p>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-6"
      action={(formData) => handleSubmit(formData)}
    >
      <FieldGroup>
        <h1 className="text-center font-bold text-xl">Choose a new password</h1>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              name="password"
              type={showsPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
              aria-describedby={message ? 'reset-error' : undefined}
              aria-invalid={message ? true : undefined}
            />
            <InputGroupAddon align="inline-end" className="pr-2">
              <InputGroupButton
                type="button"
                size="icon-sm"
                aria-label={showsPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showsPassword}
                onClick={() => setShowsPassword((isVisible) => !isVisible)}
              >
                {showsPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {message ? (
          <p id="reset-error" role="alert" className="text-destructive">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          Update password
        </Button>
      </FieldGroup>
    </form>
  )
}
