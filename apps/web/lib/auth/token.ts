import { getAuthSecret } from '@/lib/auth/config'

interface SessionPayload {
  expiresAt: number
  issuedAt: number
  version: 1
}

interface CreateSessionTokenOptions {
  now?: number
}

const SESSION_DURATION_SECONDS = 12 * 60 * 60
const SESSION_COOKIE_NAME = '__Host-exchange-session'
const textEncoder = new TextEncoder()

/** Encodes bytes with the URL-safe Base64 alphabet and without padding. */
function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

/** Decodes URL-safe Base64 into bytes. */
function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(`${normalized}${padding}`)

    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}

/** Imports the deploy secret as an HMAC-SHA-256 key. */
async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(getAuthSecret()),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign', 'verify']
  )
}

/** Creates a compact, expiring session token signed by the deploy secret. */
export async function createSessionToken(
  options: CreateSessionTokenOptions = {}
): Promise<string> {
  const issuedAt = Math.floor((options.now ?? Date.now()) / 1000)
  const payload: SessionPayload = {
    expiresAt: issuedAt + SESSION_DURATION_SECONDS,
    issuedAt,
    version: 1,
  }
  const encodedPayload = encodeBase64Url(
    textEncoder.encode(JSON.stringify(payload))
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    await getSigningKey(),
    textEncoder.encode(encodedPayload)
  )

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`
}

/** Verifies a session token's signature, version, and expiration. */
export async function verifySessionToken(
  token: string | undefined,
  now = Date.now()
): Promise<boolean> {
  if (!token) {
    return false
  }

  const [encodedPayload, encodedSignature, ...unexpected] = token.split('.')
  const signature = encodedSignature ? decodeBase64Url(encodedSignature) : null

  if (!encodedPayload || !signature || unexpected.length > 0) {
    return false
  }

  try {
    const isAuthentic = await crypto.subtle.verify(
      'HMAC',
      await getSigningKey(),
      signature,
      textEncoder.encode(encodedPayload)
    )

    if (!isAuthentic) {
      return false
    }

    const payloadBytes = decodeBase64Url(encodedPayload)

    if (!payloadBytes) {
      return false
    }

    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as Partial<SessionPayload>
    const currentTime = Math.floor(now / 1000)

    return (
      payload.version === 1 &&
      typeof payload.issuedAt === 'number' &&
      typeof payload.expiresAt === 'number' &&
      payload.issuedAt <= currentTime + 60 &&
      payload.expiresAt > currentTime
    )
  } catch {
    return false
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS }
