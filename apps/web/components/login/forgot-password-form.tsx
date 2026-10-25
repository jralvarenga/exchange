'use client'

import { authClient } from '@workspace/auth/client'
import { Button } from '@workspace/ui/components/button'
import { Field, FieldGroup, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import Link from 'next/link'
import { useState } from 'react'

/** Requests a password reset email without revealing whether the address exists. */
export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)
    const result = await authClient.requestPasswordReset({
      email: String(formData.get('email') ?? ''),
      redirectTo: '/reset-password',
    })

    if (result.error) {
      setMessage(result.error.message ?? 'The reset email could not be sent.')
      setPending(false)
      return
    }

    setSubmitted(true)
    setPending(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-bold text-xl">Check your email</h1>
        <p role="status">
          If an account uses that address, a reset link is on its way.
        </p>
        <Link href="/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-6"
      action={(formData) => {
        void handleSubmit(formData)
      }}
    >
      <FieldGroup>
        <h1 className="text-center font-bold text-xl">Forgot password</h1>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              autoComplete="username email"
              required
              disabled={pending}
              aria-describedby={message ? 'forgot-error' : undefined}
              aria-invalid={message ? true : undefined}
            />
          </InputGroup>
        </Field>
        {message ? (
          <p id="forgot-error" role="alert" className="text-destructive">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          Send reset link
        </Button>
        <p className="text-center">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
