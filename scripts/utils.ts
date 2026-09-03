/** Escapes bcrypt's dollar signs for Next.js `.env*` file parsing. */
export function formatPasswordHashForDotenv(passwordHash: string): string {
  return passwordHash.replaceAll('$', '\\$')
}
