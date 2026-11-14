import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AuthPage } from '@/components/login/auth-page'
import { VerifyEmailStatus } from '@/components/login/verify-email-status'

export const metadata: Metadata = {
  // The token in the URL is a credential. Never send it to another site.
  referrer: 'no-referrer',
  title: 'Verify email',
}

/** Opens the verification link from the sign-up email. */
export default function VerifyEmailPage() {
  return (
    <AuthPage>
      <Suspense fallback={<p role="status">Confirming your email…</p>}>
        <VerifyEmailStatus />
      </Suspense>
    </AuthPage>
  )
}
