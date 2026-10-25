import { AuthPage } from '@/components/login/auth-page'
import { ForgotPasswordForm } from '@/components/login/forgot-password-form'

/** Renders the password reset request form. */
export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordForm />
    </AuthPage>
  )
}
