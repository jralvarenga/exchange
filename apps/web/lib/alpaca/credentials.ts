import 'server-only'

import {
  deleteAlpacaCredential,
  findAlpacaCredential,
  findUserAlpacaEnvironment,
  listAlpacaCredentials,
  markAlpacaCredentialInvalid,
  updateAlpacaCredentialStatus,
  updateUserAlpacaEnvironment,
  upsertAlpacaCredential,
} from '@workspace/db/queries/alpaca-credentials'
import { z } from 'zod'

import { AlpacaApiError, getAccount } from '@/lib/alpaca/client'
import { maskKeyId } from '@/lib/alpaca/mask-key-id'
import { alpacaEnvironmentSchema } from '@/lib/alpaca/schemas'
import {
  credentialAad,
  decryptSecret,
  encryptSecret,
  parseEncryptionKeys,
} from '@/lib/crypto/secret-box'
import { env } from '@/lib/env'

const credentialStatusSchema = z.enum(['unverified', 'valid', 'invalid'])

const userIdSchema = z.string().trim().min(1)

const keyMaterialSchema = z.object({
  keyId: z.string().trim().min(8).max(128),
  secret: z.string().trim().min(8).max(256),
})

export const maskedAlpacaCredentialSchema = z.object({
  environment: alpacaEnvironmentSchema,
  keyIdMasked: z.string(),
  lastVerifiedAt: z.iso.datetime().nullable(),
  status: credentialStatusSchema,
})

const saveCredentialInputSchema = z.object({
  environment: alpacaEnvironmentSchema,
  fetcher: z
    .custom<typeof fetch>((value) => typeof value === 'function')
    .optional(),
  keyId: keyMaterialSchema.shape.keyId,
  secret: keyMaterialSchema.shape.secret,
  userId: userIdSchema,
})

const credentialActionInputSchema = z.object({
  environment: alpacaEnvironmentSchema,
  fetcher: z
    .custom<typeof fetch>((value) => typeof value === 'function')
    .optional(),
  userId: userIdSchema,
})

const userEnvironmentInputSchema = z.object({
  environment: alpacaEnvironmentSchema,
  userId: userIdSchema,
})

export type MaskedAlpacaCredential = z.infer<
  typeof maskedAlpacaCredentialSchema
>
type SaveCredentialInput = z.infer<typeof saveCredentialInputSchema>
type CredentialActionInput = z.infer<typeof credentialActionInputSchema>
type UserEnvironmentInput = z.infer<typeof userEnvironmentInputSchema>

/** Raised when the signed-in user has no usable Alpaca keys. */
export class AlpacaCredentialsError extends Error {
  readonly code: 'INVALID' | 'MISSING'

  constructor(code: 'INVALID' | 'MISSING') {
    super(
      code === 'MISSING'
        ? 'Alpaca credentials are required.'
        : 'Alpaca credentials are invalid.'
    )
    this.name = 'AlpacaCredentialsError'
    this.code = code
  }
}

/**
 * Checks the key pair against Alpaca, then stores it encrypted for this user.
 * The returned value is masked and never includes the secret.
 */
export async function saveCredential(
  input: SaveCredentialInput
): Promise<MaskedAlpacaCredential> {
  const parsed = saveCredentialInputSchema.parse(input)

  try {
    await getAccount({
      apiKeyId: parsed.keyId,
      apiSecretKey: parsed.secret,
      environment: parsed.environment,
      fetcher: parsed.fetcher,
    })
  } catch (error) {
    if (isRejectedCredential(error)) {
      throw new AlpacaCredentialsError('INVALID')
    }

    throw error
  }

  const now = new Date()
  const row = await upsertAlpacaCredential({
    environment: parsed.environment,
    id: crypto.randomUUID(),
    keyIdCiphertext: encryptField({
      environment: parsed.environment,
      field: 'keyId',
      plaintext: parsed.keyId,
      userId: parsed.userId,
    }),
    keyIdLast4: parsed.keyId.slice(-4),
    lastVerifiedAt: now,
    secretCiphertext: encryptField({
      environment: parsed.environment,
      field: 'secret',
      plaintext: parsed.secret,
      userId: parsed.userId,
    }),
    status: 'valid',
    userId: parsed.userId,
  })

  return toMaskedCredential({
    environment: parsed.environment,
    keyId: parsed.keyId,
    lastVerifiedAt: row.lastVerifiedAt,
    status: 'valid',
  })
}

/**
 * Decrypts the stored key pair, calls Alpaca, and records the result.
 */
export async function testCredential(
  input: CredentialActionInput
): Promise<MaskedAlpacaCredential> {
  const parsed = credentialActionInputSchema.parse(input)
  const row = await findAlpacaCredential(parsed)

  if (!row) {
    throw new AlpacaCredentialsError('MISSING')
  }

  const keyId = decryptField({
    ciphertext: row.keyIdCiphertext,
    environment: parsed.environment,
    field: 'keyId',
    userId: parsed.userId,
  })
  const secret = decryptField({
    ciphertext: row.secretCiphertext,
    environment: parsed.environment,
    field: 'secret',
    userId: parsed.userId,
  })

  try {
    await getAccount({
      apiKeyId: keyId,
      apiSecretKey: secret,
      environment: parsed.environment,
      fetcher: parsed.fetcher,
    })
  } catch (error) {
    if (isRejectedCredential(error)) {
      await markAlpacaCredentialInvalid(parsed)
      throw new AlpacaCredentialsError('INVALID')
    }

    throw error
  }

  const verifiedAt = new Date()
  await updateAlpacaCredentialStatus({
    environment: parsed.environment,
    lastVerifiedAt: verifiedAt,
    status: 'valid',
    userId: parsed.userId,
  })

  return toMaskedCredential({
    environment: parsed.environment,
    keyId,
    lastVerifiedAt: verifiedAt,
    status: 'valid',
  })
}

/** Marks the signed-in user's key pair invalid after Alpaca rejects it. */
export async function markCredentialInvalid(
  input: UserEnvironmentInput
): Promise<void> {
  const parsed = userEnvironmentInputSchema.parse(input)
  await markAlpacaCredentialInvalid(parsed)
}

/** Removes one user's stored key pair for an environment. */
export async function removeCredential(
  input: UserEnvironmentInput
): Promise<void> {
  const parsed = userEnvironmentInputSchema.parse(input)
  await deleteAlpacaCredential(parsed)
}

/** Lists masked key metadata for the signed-in user. Secrets stay on the server. */
export async function listMaskedCredentials(
  userId: string
): Promise<MaskedAlpacaCredential[]> {
  const parsedUserId = userIdSchema.parse(userId)
  const rows = await listAlpacaCredentials(parsedUserId)

  return rows.flatMap((row) => {
    const environment = alpacaEnvironmentSchema.safeParse(row.environment)
    const status = credentialStatusSchema.safeParse(row.status)

    if (!environment.success || !status.success) {
      return []
    }

    let keyIdMasked = `••••${row.keyIdLast4}`

    try {
      keyIdMasked = maskKeyId(
        decryptField({
          ciphertext: row.keyIdCiphertext,
          environment: environment.data,
          field: 'keyId',
          userId: parsedUserId,
        })
      )
    } catch {
      keyIdMasked = `••••${row.keyIdLast4}`
    }

    return [
      maskedAlpacaCredentialSchema.parse({
        environment: environment.data,
        keyIdMasked,
        lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
        status: status.data,
      }),
    ]
  })
}

/**
 * Returns Alpaca client options for the user's active environment.
 * Throws when that environment has no valid stored key pair.
 */
export async function resolveAlpacaClientOptions(userId: string): Promise<{
  apiKeyId: string
  apiSecretKey: string
  environment: 'live' | 'paper'
}> {
  const parsedUserId = userIdSchema.parse(userId)
  const environment = await resolveActiveEnvironment(parsedUserId)
  const row = await findAlpacaCredential({
    environment,
    userId: parsedUserId,
  })

  if (!row) {
    throw new AlpacaCredentialsError('MISSING')
  }

  if (row.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  return {
    apiKeyId: decryptField({
      ciphertext: row.keyIdCiphertext,
      environment,
      field: 'keyId',
      userId: parsedUserId,
    }),
    apiSecretKey: decryptField({
      ciphertext: row.secretCiphertext,
      environment,
      field: 'secret',
      userId: parsedUserId,
    }),
    environment,
  }
}

/**
 * Returns the environment the user trades in. One saved key pair is enough:
 * when the selected environment has no keys but the other one does, that one
 * becomes active and is saved, so a user with only live keys uses live.
 */
export async function resolveActiveEnvironment(
  userId: string
): Promise<'live' | 'paper'> {
  const parsedUserId = userIdSchema.parse(userId)
  const [selected, rows] = await Promise.all([
    findUserAlpacaEnvironment(parsedUserId),
    listAlpacaCredentials(parsedUserId),
  ])
  const environment = selected ?? 'paper'

  if (rows.some((row) => row.environment === environment)) {
    return environment
  }

  const other = environment === 'paper' ? 'live' : 'paper'

  if (!rows.some((row) => row.environment === other)) {
    return environment
  }

  await updateUserAlpacaEnvironment({
    environment: other,
    userId: parsedUserId,
  })

  return other
}

/**
 * Activates paper or live trading when that environment has a valid key pair.
 */
export async function setActiveAlpacaEnvironment(
  input: UserEnvironmentInput
): Promise<void> {
  const parsed = userEnvironmentInputSchema.parse(input)
  const row = await findAlpacaCredential(parsed)

  if (row?.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  await updateUserAlpacaEnvironment(parsed)
}

interface EncryptFieldInput {
  environment: 'live' | 'paper'
  field: 'keyId' | 'secret'
  plaintext: string
  userId: string
}

/** Encrypts one credential field with AAD bound to the owning row. */
function encryptField(input: EncryptFieldInput): string {
  return encryptSecret({
    aad: credentialAad(input),
    keys: parseEncryptionKeys(env.CREDENTIALS_ENCRYPTION_KEYS),
    plaintext: input.plaintext,
  })
}

interface DecryptFieldInput {
  ciphertext: string
  environment: 'live' | 'paper'
  field: 'keyId' | 'secret'
  userId: string
}

/** Decrypts one credential field. Failures stay generic and are not logged. */
function decryptField(input: DecryptFieldInput): string {
  try {
    return decryptSecret({
      aad: credentialAad(input),
      keys: parseEncryptionKeys(env.CREDENTIALS_ENCRYPTION_KEYS),
      payload: input.ciphertext,
    })
  } catch {
    throw new AlpacaCredentialsError('INVALID')
  }
}

interface MaskedCredentialSource {
  environment: 'live' | 'paper'
  keyId: string
  lastVerifiedAt: Date | null
  status: 'invalid' | 'unverified' | 'valid'
}

/** Builds the only credential shape allowed to leave the server. */
function toMaskedCredential(
  input: MaskedCredentialSource
): MaskedAlpacaCredential {
  return maskedAlpacaCredentialSchema.parse({
    environment: input.environment,
    keyIdMasked: maskKeyId(input.keyId),
    lastVerifiedAt: input.lastVerifiedAt?.toISOString() ?? null,
    status: input.status,
  })
}

/** Alpaca 401 and 403 mean the stored key id or secret was rejected. */
function isRejectedCredential(error: unknown): boolean {
  return (
    error instanceof AlpacaApiError &&
    (error.status === 401 || error.status === 403)
  )
}
