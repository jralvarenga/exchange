import { Dices, LockKeyhole } from 'lucide-react'
import type { Metadata } from 'next'

import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Unlock dashboard',
}

/** Renders the single-operator access gate for the private dashboard. */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-muted px-4 py-10 text-foreground sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-primary"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Dices aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </span>
            <span className="font-medium tracking-tight">Exchange</span>
          </div>
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            Private
          </span>
        </div>

        <section
          aria-labelledby="login-title"
          className="rounded-[2rem] bg-card p-6 shadow-md ring-1 ring-foreground/5 sm:p-8 dark:ring-foreground/10"
        >
          <p className="font-mono text-primary text-xs uppercase tracking-[0.18em]">
            Operator access
          </p>
          <h1
            id="login-title"
            className="mt-3 text-balance font-semibold text-3xl tracking-[-0.035em]"
          >
            Your portfolio stays behind one door.
          </h1>
          <p className="mt-3 max-w-sm text-pretty text-muted-foreground leading-6">
            Enter the password configured by the person who deployed this
            dashboard.
          </p>

          <LoginForm />
        </section>

        <p className="mt-5 px-4 text-center text-muted-foreground text-sm leading-5">
          Lost access? Rotate the password hash and auth secret on the server.
        </p>
      </div>
    </main>
  )
}
