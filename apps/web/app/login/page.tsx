import type { Metadata } from 'next'

import { AuthPage } from '@/components/login/auth-page'
import { LoginForm } from '@/components/login/login-form'
import { safeNextPath } from '@/lib/auth/next-path'
import { redirectIfSignedIn } from '@/lib/auth/redirect-if-signed-in'

interface PageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

export const metadata: Metadata = {
  alternates: {
    canonical: '/login',
  },
  description: 'Log in to Treid, a quiet trading desk for your Alpaca account.',
  robots: {
    follow: true,
    index: true,
  },
  title: 'Log in',
}

/** Renders email, password, and Google sign-in. */
export default async function LoginPage({ searchParams }: PageProps) {
  const next = safeNextPath((await searchParams).next)
  await redirectIfSignedIn(next)

  return (
    <AuthPage>
      <LoginForm next={next} />
    </AuthPage>
  )
}
