import 'server-only'

interface SerializeWithoutCredentialsInput {
  alpaca: {
    apiKeyId: string
    apiSecretKey: string
  }
  data: unknown
}

/**
 * Serializes a handler result, or returns undefined when it contains the
 * decrypted key id or secret. A last line of defence: no handler should
 * return credentials, and this keeps a future mistake from reaching members.
 */
export function serializeWithoutCredentials(
  input: SerializeWithoutCredentialsInput
): string | undefined {
  const body = JSON.stringify(input.data) ?? 'null'
  // Match the raw value and its JSON-escaped form: a key with a quote, a
  // backslash or a control character is escaped inside the body.
  const leaked = [input.alpaca.apiKeyId, input.alpaca.apiSecretKey].some(
    (value) =>
      value.length > 0 &&
      (body.includes(value) ||
        body.includes(JSON.stringify(value).slice(1, -1)))
  )

  return leaked ? undefined : body
}
