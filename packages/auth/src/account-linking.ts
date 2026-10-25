interface CanLinkTrustedProviderInput {
  emailVerified: boolean
}

/**
 * True when a trusted social provider may join an existing local user.
 * Unverified password sign-ups must not receive a later Google login.
 */
export function canLinkTrustedProvider(
  input: CanLinkTrustedProviderInput
): boolean {
  return input.emailVerified
}
