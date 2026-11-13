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
import { useState } from 'react'

import { AuthDivider } from '@/components/login/auth-divider'
import { AuthHeader } from '@/components/login/auth-header'
import { AuthLink } from '@/components/login/auth-link'
import { GoogleSignInButton } from '@/components/login/google-sign-in-button'
import { LegalNotice } from '@/components/login/legal-notice'
import { ProfilePhotoField } from '@/components/login/profile-photo-field'

interface Props {
  /** Where to land after verifying the email, e.g. an invitation link. */
  next: string
}

/** Creates a password account with an optional photo and tells the user to verify their email. */
export function SignUpForm({ next }: Props) {
  const [message, setMessage] = useState<string>()
  const [photo, setPhoto] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showsPassword, setShowsPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)

    try {
      const result = await authClient.signUp.email({
        callbackURL: next,
        email: String(formData.get('email') ?? ''),
        image: photo,
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
      <div className="flex flex-col items-start gap-8" role="status">
        <AuthHeader
          description="We sent a verification link. Open it to finish creating your account."
          title="Check your email"
        />
        <AuthLink href="/login">Back to log in</AuthLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <AuthHeader
        description="Start on paper. You add your Alpaca keys after this."
        title="Create your account"
      />
      <FieldGroup>
        <GoogleSignInButton
          callbackURL={next}
          disabled={pending}
          onBusyChange={setPending}
        />
        <AuthDivider />
        <form action={(formData) => handleSubmit(formData)}>
          <FieldGroup>
            <ProfilePhotoField
              disabled={pending}
              onChange={setPhoto}
              value={photo}
            />
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
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
                  placeholder="you@example.com"
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
                  placeholder="At least 8 characters"
                  required
                  disabled={pending}
                  aria-describedby={message ? 'signup-error' : undefined}
                  aria-invalid={message ? true : undefined}
                />
                <InputGroupAddon align="inline-end">
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
            <Button
              type="submit"
              disabled={pending}
              size="xl"
              className="w-full"
            >
              Create account
            </Button>
          </FieldGroup>
        </form>
        <LegalNotice />
      </FieldGroup>
      <p className="text-center text-muted-foreground">
        Already have an account?{' '}
        <AuthLink
          href={
            next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`
          }
        >
          Log in
        </AuthLink>
      </p>
    </div>
  )
}
