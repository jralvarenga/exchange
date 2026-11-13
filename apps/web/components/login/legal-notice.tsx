import { AuthLink } from '@/components/login/auth-link'
import { getLegalLinks } from '@/lib/legal'

/** The agreement line under the sign-up options, linking both legal pages. */
export function LegalNotice() {
  const legalLinks = getLegalLinks()

  return (
    <p className="text-center text-muted-foreground text-sm">
      By creating an account, you agree to the{' '}
      <AuthLink href={legalLinks.terms}>Terms of service</AuthLink> and{' '}
      <AuthLink href={legalLinks.privacy}>Privacy policy</AuthLink>.
    </p>
  )
}
