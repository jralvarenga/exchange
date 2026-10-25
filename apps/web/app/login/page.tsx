import { AuthPage } from '@/components/login/auth-page'
import { LoginForm } from '@/components/login/login-form'

/** Renders email, password, and Google sign-in. */
export default function LoginPage() {
  return (
    <AuthPage>
      <LoginForm />
    </AuthPage>
  )
}
