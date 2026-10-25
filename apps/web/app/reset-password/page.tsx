import { Suspense } from 'react'

import { AuthPage } from '@/components/login/auth-page'
import { ResetPasswordToken } from '@/components/login/reset-password-token'

/** Renders the password reset form after the email link is opened. */
export default function ResetPasswordPage() {
  return (
    <AuthPage>
      <Suspense fallback={<p role="status">Loading reset link…</p>}>
        <ResetPasswordToken />
      </Suspense>
    </AuthPage>
  )
}
