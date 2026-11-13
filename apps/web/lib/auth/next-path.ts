/**
 * Accepts a same-site path to return to after signing in, such as an
 * invitation link. Anything else, including `//host` and absolute URLs,
 * falls back to the dashboard.
 */
export function safeNextPath(value: string | string[] | undefined): string {
  if (typeof value !== 'string') {
    return '/'
  }

  return /^\/(?![/\\])[\w\-./~%]*$/u.test(value) ? value : '/'
}
