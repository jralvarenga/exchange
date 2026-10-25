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
import { Eye, EyeOff, GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthDivider } from '@/components/login/auth-divider'
import { GoogleSignInButton } from '@/components/login/google-sign-in-button'
import { cn } from '@/lib/utils'

interface Props extends React.ComponentProps<'div'> {}

/** Email and password sign-in, with Google offered first. */
export function LoginForm({ className, ...props }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showsPassword, setShowsPassword] = useState(false)

  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setMessage(undefined)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')
    const result = await authClient.signIn.email({
      callbackURL: '/',
      email,
      password,
    })

    if (result.error) {
      setMessage(result.error.message ?? 'That sign-in did not work.')
      setPending(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" aria-hidden="true" />
          </div>
          <h1 className="font-bold text-xl">Welcome to Exchange.</h1>
        </div>
        <GoogleSignInButton />
        <AuthDivider />
        <form
          action={(formData) => {
            void handleSubmit(formData)
          }}
        >
          <FieldGroup>
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
                  aria-describedby={message ? 'login-error' : undefined}
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
                  autoComplete="current-password"
                  required
                  disabled={pending}
                  aria-describedby={message ? 'login-error' : undefined}
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
              <Field>
                <p
                  id="login-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {message}
                </p>
              </Field>
            ) : null}
            <Field>
              <Button type="submit" disabled={pending} className="w-full">
                Login
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <p className="text-center">
          <Link
            href="/forgot-password"
            className="underline underline-offset-4"
          >
            Forgot password
          </Link>
        </p>
        <p className="text-center">
          New here?{' '}
          <Link href="/sign-up" className="underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </FieldGroup>
    </div>
  )
}
