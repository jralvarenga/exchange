'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldGroup, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Eye, EyeOff, GalleryVerticalEnd } from 'lucide-react'
import { useActionState, useState } from 'react'

import { login } from '@/app/login/actions'
import { cn } from '@/lib/utils'

interface Props extends React.ComponentProps<'div'> {}

/** Maps the existing login form UI to the password session action. */
export function LoginForm({ className, ...props }: Props) {
  const [state, action, pending] = useActionState(login, {})
  const [showsPassword, setShowsPassword] = useState(false)

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form action={action}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="/login"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Exchange.</span>
            </a>
            <h1 className="font-bold text-xl">Welcome to Exchange.</h1>
          </div>
          <Field>
            <FieldLabel htmlFor="inline-end-input">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="inline-end-input"
                name="password"
                type={showsPassword ? 'text' : 'password'}
                placeholder="Enter password"
                autoComplete="current-password"
                aria-describedby={state.message ? 'login-error' : undefined}
                aria-invalid={state.message ? true : undefined}
                disabled={pending}
                required
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
          {state.message ? (
            <Field>
              <p
                id="login-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {state.message}
              </p>
            </Field>
          ) : null}
          <Field>
            <Button type="submit" disabled={pending}>
              Login
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
