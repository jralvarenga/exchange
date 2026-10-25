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
import { useState } from 'react'

import { AuthDivider } from '@/components/login/auth-divider'
import { GoogleSignInButton } from '@/components/login/google-sign-in-button'

/** Creates a password account and tells the user to verify their email. */
export function SignUpForm() {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showsPassword, setShowsPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)

    try {
      const result = await authClient.signUp.email({
        callbackURL: '/',
        email: String(formData.get('email') ?? ''),
        name: String(formData.get('name') ?? ''),
        password: String(formData.get('password') ?? ''),
      })

      if (result.error) {
        setMessage(result.error.message ?? 'The account could not be created.')
        return
      }

      setSubmitted(true)
    } catch {
      setMessage('The account could not be created.')
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-bold text-xl">Check your email</h1>
        <p role="status">
          We sent a verification link. Open it to finish creating your account.
        </p>
        <Link href="/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <h1 className="text-center font-bold text-xl">Create your account</h1>
        <GoogleSignInButton disabled={pending} onBusyChange={setPending} />
        <AuthDivider />
        <form action={(formData) => handleSubmit(formData)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  disabled={pending}
                />
              </InputGroup>
            </Field>
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
                  aria-describedby={message ? 'signup-error' : undefined}
                  aria-invalid={message ? true : undefined}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showsPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={pending}
                  aria-describedby={message ? 'signup-error' : undefined}
                  aria-invalid={message ? true : undefined}
                />
                <InputGroupAddon align="inline-end" className="pr-2">
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={
                      showsPassword ? 'Hide password' : 'Show password'
                    }
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
              <p id="signup-error" role="alert" className="text-destructive">
                {message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="w-full">
              Create account
            </Button>
          </FieldGroup>
        </form>
        <p className="text-center">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4">
            Login
          </Link>
        </p>
      </FieldGroup>
    </div>
  )
}
