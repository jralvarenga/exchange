import { AuthPage } from '@/components/login/auth-page'
import { SignUpForm } from '@/components/login/sign-up-form'
import { redirectIfSignedIn } from '@/lib/auth/redirect-if-signed-in'

/** Renders Google and email sign-up. */
export default async function SignUpPage() {
  await redirectIfSignedIn()

  return (
    <AuthPage>
      <SignUpForm />
    </AuthPage>
  )
}
