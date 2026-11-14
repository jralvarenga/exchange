import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { z } from 'zod'

/** `v1` boxes bind connection, environment and field. `v2` adds the workspace. */
export const BOX_VERSIONS = ['v1', 'v2'] as const
const CURRENT_VERSION: BoxVersion = 'v2'
const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_BYTES = 32

const keyIdSchema = z.string().regex(/^[A-Za-z0-9_-]+$/u)

export type BoxVersion = (typeof BOX_VERSIONS)[number]

interface EncryptionKey {
  id: string
  key: Buffer
}

interface EncryptSecretInput {
  aad: string
  keys: EncryptionKey[]
  plaintext: string
  version?: BoxVersion
}

interface DecryptSecretInput {
  aad: string
  keys: EncryptionKey[]
  payload: string
}

/** The row and column a stored Alpaca credential belongs to. */
export type CredentialBinding = {
  connectionId: string
  environment: string
  field: 'keyId' | 'secret'
  workspaceId: string
}

interface CredentialAadInput extends CredentialBinding {
  version: BoxVersion
}

interface EncryptCredentialInput {
  binding: CredentialBinding
  keys: EncryptionKey[]
  plaintext: string
}

interface DecryptCredentialInput {
  binding: CredentialBinding
  keys: EncryptionKey[]
  payload: string
}

interface NeedsRewrapInput {
  keys: EncryptionKey[]
  payload: string
}

/**
 * Binds a ciphertext to one workspace, connection, environment and field.
 * A copy pasted into another row, column or workspace fails to decrypt.
 * `v1` predates the workspace binding and is only read until rows are rewrapped.
 */
export function credentialAad(input: CredentialAadInput): string {
  if (input.version === 'v1') {
    return `connection:${input.connectionId}:${input.environment}:${input.field}`
  }

  return JSON.stringify([
    'alpaca-credential',
    input.version,
    input.workspaceId,
    input.connectionId,
    input.environment,
    input.field,
  ])
}

/** Encrypts one Alpaca credential field with the current box version. */
export function encryptCredential(input: EncryptCredentialInput): string {
  return encryptSecret({
    aad: credentialAad({ ...input.binding, version: CURRENT_VERSION }),
    keys: input.keys,
    plaintext: input.plaintext,
    version: CURRENT_VERSION,
  })
}

/** Decrypts one Alpaca credential field, choosing the AAD from its box version. */
export function decryptCredential(input: DecryptCredentialInput): string {
  return decryptSecret({
    aad: credentialAad({
      ...input.binding,
      version: readBoxVersion(input.payload),
    }),
    keys: input.keys,
    payload: input.payload,
  })
}

/**
 * True when a stored credential uses an older box version or a key that is no
 * longer the primary one, so the rewrap script should re-encrypt it.
 */
export function needsRewrap(input: NeedsRewrapInput): boolean {
  const [version, keyId] = input.payload.split(':')

  return version !== CURRENT_VERSION || keyId !== input.keys[0]?.id
}

/**
 * Parses `keyId:base64` pairs. The first key encrypts. Every key can decrypt.
 */
export function parseEncryptionKeys(value: string): EncryptionKey[] {
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  if (entries.length === 0) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEYS is empty.')
  }

  const parsed = entries.map(parseEncryptionKey)

  if (new Set(parsed.map((entry) => entry.id)).size !== parsed.length) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEYS contains duplicate key ids.')
  }

  return parsed
}

/**
 * Encrypts a secret with AES-256-GCM.
 * Stored form: `<version>:<keyId>:<iv>:<tag>:<ciphertext>`, each binary part base64url.
 */
export function encryptSecret(input: EncryptSecretInput): string {
  const encryptionKey = input.keys[0]

  if (!encryptionKey) {
    throw new Error('No encryption key is configured.')
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey.key, iv)
  cipher.setAAD(Buffer.from(input.aad, 'utf8'))
  const ciphertext = Buffer.concat([
    cipher.update(input.plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  if (tag.length !== TAG_BYTES) {
    throw new Error('Unable to encrypt credential.')
  }

  return [
    input.version ?? CURRENT_VERSION,
    encryptionKey.id,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':')
}

/**
 * Decrypts a secret box. The key id selects the key. The AAD must match.
 */
export function decryptSecret(input: DecryptSecretInput): string {
  const parts = input.payload.split(':')

  if (parts.length !== 5 || !isBoxVersion(parts[0])) {
    throw new Error('Unable to decrypt credential.')
  }

  const [, keyId, ivPart, tagPart, ciphertextPart] = parts

  if (!keyId || !ivPart || !tagPart || ciphertextPart === undefined) {
    throw new Error('Unable to decrypt credential.')
  }

  const encryptionKey = input.keys.find((key) => key.id === keyId)

  if (!encryptionKey) {
    throw new Error('Unable to decrypt credential.')
  }

  try {
    const authTag = Buffer.from(tagPart, 'base64url')

    if (authTag.length !== TAG_BYTES) {
      throw new Error('Unable to decrypt credential.')
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey.key,
      Buffer.from(ivPart, 'base64url')
    )
    decipher.setAAD(Buffer.from(input.aad, 'utf8'))
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error('Unable to decrypt credential.')
  }
}

/** Reads the version prefix of a stored box. Unknown versions fail closed. */
function readBoxVersion(payload: string): BoxVersion {
  const version = payload.split(':', 1)[0]

  if (!isBoxVersion(version)) {
    throw new Error('Unable to decrypt credential.')
  }

  return version
}

/** Narrows a string to a supported box version. */
function isBoxVersion(value: string | undefined): value is BoxVersion {
  return BOX_VERSIONS.some((version) => version === value)
}

/** Parses one `keyId:base64` entry into a 32-byte AES key. */
function parseEncryptionKey(entry: string): EncryptionKey {
  const separator = entry.indexOf(':')
  const keyId = separator > 0 ? entry.slice(0, separator) : ''
  const encoded = separator > 0 ? entry.slice(separator + 1) : ''
  const parsedKeyId = keyIdSchema.safeParse(keyId)

  if (!parsedKeyId.success || encoded.length === 0) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEYS entry is invalid.')
  }

  const key = decodeKey(encoded)

  if (key.length !== KEY_BYTES) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEYS entry is invalid.')
  }

  return {
    id: parsedKeyId.data,
    key,
  }
}

const STANDARD_BASE64 = /^[A-Za-z0-9+/]+=*$/u
const URL_SAFE_BASE64 = /^[A-Za-z0-9_-]+$/u

/** Decodes a standard or URL-safe base64 AES key. */
function decodeKey(encoded: string): Buffer {
  const encoding =
    encoded.includes('+') || encoded.includes('/') || encoded.includes('=')
      ? 'base64'
      : 'base64url'
  const alphabet = encoding === 'base64' ? STANDARD_BASE64 : URL_SAFE_BASE64

  if (!alphabet.test(encoded)) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEYS entry is invalid.')
  }

  return Buffer.from(encoded, encoding)
}
