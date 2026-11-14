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
  const leaked = [input.alpaca.apiKeyId, input.alpaca.apiSecretKey].some(
    (value) => value.length > 0 && body.includes(value)
  )

  return leaked ? undefined : body
}
