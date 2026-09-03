'use client'

import { Button } from '@workspace/ui/components/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Label } from '@workspace/ui/components/label'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useActionState, useState } from 'react'

import { login } from '@/app/login/actions'

/** Renders the password-only dashboard login form. */
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {})
  const [showsPassword, setShowsPassword] = useState(false)

  return (
    <form action={action} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Dashboard password</Label>
        <InputGroup className="h-12 rounded-full bg-background ring-1 ring-border has-[[data-slot=input-group-control]:focus-visible]:ring-primary/25">
          <InputGroupInput
            id="password"
            name="password"
            type={showsPassword ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            aria-describedby={state.message ? 'login-error' : undefined}
            aria-invalid={state.message ? true : undefined}
            className="px-4 text-base md:text-base"
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
        {state.message ? (
          <p id="login-error" role="alert" className="text-destructive text-sm">
            {state.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Unlocking…
          </>
        ) : (
          'Unlock dashboard'
        )}
      </Button>
    </form>
  )
}
