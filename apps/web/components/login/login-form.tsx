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
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthDivider } from '@/components/login/auth-divider'
import { AuthHeader } from '@/components/login/auth-header'
import { AuthLink } from '@/components/login/auth-link'
import { GoogleSignInButton } from '@/components/login/google-sign-in-button'
import { cn } from '@/lib/utils'

interface Props extends React.ComponentProps<'div'> {
  /** Where to land after signing in, e.g. an invitation link. */
  next: string
}

/** Email and password sign-in, with Google offered first. */
export function LoginForm({ className, next, ...props }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showsPassword, setShowsPassword] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const result = await authClient.signIn.email({
        callbackURL: next,
        email,
        password,
      })

      if (result.error) {
        setMessage(result.error.message ?? 'That sign-in did not work.')
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setMessage('That sign-in did not work.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      <AuthHeader
        description="Log in to your account to continue."
        title="Welcome back"
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
                  aria-describedby={message ? 'login-error' : undefined}
                  aria-invalid={message ? true : undefined}
                />
              </InputGroup>
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <AuthLink href="/forgot-password">Forgot password?</AuthLink>
              </div>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showsPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={pending}
                  aria-describedby={message ? 'login-error' : undefined}
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
              <p id="login-error" role="alert" className="text-destructive">
                {message}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={pending}
              size="xl"
              className="w-full"
            >
              Log in
            </Button>
          </FieldGroup>
        </form>
      </FieldGroup>
      <p className="text-center text-muted-foreground">
        New here?{' '}
        <AuthLink
          href={
            next === '/'
              ? '/sign-up'
              : `/sign-up?next=${encodeURIComponent(next)}`
          }
        >
          Create an account
        </AuthLink>
      </p>
    </div>
  )
}
