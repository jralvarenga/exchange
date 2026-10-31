import { AuthPage } from '@/components/login/auth-page'
import { LoginForm } from '@/components/login/login-form'
import { redirectIfSignedIn } from '@/lib/auth/redirect-if-signed-in'

/** Renders email, password, and Google sign-in. */
export default async function LoginPage() {
  await redirectIfSignedIn()

  return (
    <AuthPage>
      <LoginForm />
    </AuthPage>
  )
}
