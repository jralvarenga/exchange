import { Suspense } from 'react'

import { AuthPage } from '@/components/login/auth-page'
import { VerifyEmailStatus } from '@/components/login/verify-email-status'

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
