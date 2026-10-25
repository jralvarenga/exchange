interface IsSessionFreshInput {
  createdAt: Date | string
  maxAgeMs: number
  now?: number
}

/** True when the session was created within the allowed age. */
export function isSessionFresh(input: IsSessionFreshInput): boolean {
  const createdAt = new Date(input.createdAt).getTime()

  if (Number.isNaN(createdAt)) {
    return false
  }

  return (input.now ?? Date.now()) - createdAt <= input.maxAgeMs
}
