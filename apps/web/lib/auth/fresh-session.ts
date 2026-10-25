interface IsSessionFreshInput {
  createdAt: Date | string
  maxAgeMs: number
  now?: number
}

const CLOCK_SKEW_MS = 60 * 1000

/** True when the session was created within the allowed age, ignoring 1 minute of clock skew. */
export function isSessionFresh(input: IsSessionFreshInput): boolean {
  const createdAt = new Date(input.createdAt).getTime()
  const now = input.now ?? Date.now()

  if (Number.isNaN(createdAt) || createdAt > now + CLOCK_SKEW_MS) {
    return false
  }

  return now - createdAt <= input.maxAgeMs
}
