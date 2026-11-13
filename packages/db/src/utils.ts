const legacySslMode = /([?&]sslmode=)(prefer|require|verify-ca)(?=[&#]|$)/g
const libpqCompat = /[?&]uselibpqcompat=true(?=[&#]|$)/

/**
 * Rewrites every `sslmode=prefer|require|verify-ca` to `sslmode=verify-full`.
 * pg 8 already treats those modes as verify-full and warns on every start, so
 * this keeps the same certificate checks without the warning. URLs that opt
 * into `uselibpqcompat=true` or set no SSL mode, like local compose, are
 * unchanged.
 */
export function normalizeDatabaseUrl(url: string): string {
  if (libpqCompat.test(url)) {
    return url
  }

  return url.replace(legacySslMode, '$1verify-full')
}
