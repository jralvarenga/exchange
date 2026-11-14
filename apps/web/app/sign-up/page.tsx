import type { Metadata } from 'next'

import { AuthPage } from '@/components/login/auth-page'
import { SignUpForm } from '@/components/login/sign-up-form'
import { safeNextPath } from '@/lib/auth/next-path'
import { redirectIfSignedIn } from '@/lib/auth/redirect-if-signed-in'

interface PageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

export const metadata: Metadata = {
  alternates: {
    canonical: '/sign-up',
  },
  description:
    'Create a Treid account and trade on your Alpaca account, on your own or with your team.',
  robots: {
    follow: true,
    index: true,
  },
  title: 'Sign up',
}

/** Renders Google and email sign-up. */
export default async function SignUpPage({ searchParams }: PageProps) {
  const next = safeNextPath((await searchParams).next)
  await redirectIfSignedIn(next)

  return (
    <AuthPage>
      <SignUpForm next={next} />
    </AuthPage>
  )
}
