import { AuthPage } from '@/components/login/auth-page'
import { ResetPasswordForm } from '@/components/login/reset-password-form'

interface Props {
  params: Promise<{
    token: string
  }>
}

/** Renders the reset form for the token Better Auth puts in the email link. */
export default async function ResetPasswordTokenPage({ params }: Props) {
  const { token } = await params

  return (
    <AuthPage>
      <ResetPasswordForm token={token} />
    </AuthPage>
  )
}
