import type { Metadata } from 'next'

import { AuthPage } from '@/components/login/auth-page'
import { ForgotPasswordForm } from '@/components/login/forgot-password-form'

export const metadata: Metadata = {
  description: 'Get a link to reset your Treid password.',
  title: 'Forgot password',
}

/** Renders the password reset request form. */
export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordForm />
    </AuthPage>
  )
}
