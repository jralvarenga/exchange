import { AuthPage } from '@/components/login/auth-page'
import { SignUpForm } from '@/components/login/sign-up-form'

/** Renders Google and email sign-up. */
export default function SignUpPage() {
  return (
    <AuthPage>
      <SignUpForm />
    </AuthPage>
  )
}
