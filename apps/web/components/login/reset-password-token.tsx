'use client'

import { useSearchParams } from 'next/navigation'

import { ResetPasswordForm } from '@/components/login/reset-password-form'

/** Passes the email link's token into the reset form. */
export function ResetPasswordToken() {
  const token = useSearchParams().get('token') ?? ''

  return <ResetPasswordForm token={token} />
}
