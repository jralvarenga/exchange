import 'server-only'

import type { ActivityActor } from '@workspace/db/queries/activity'
import {
  type AlpacaConnectionRow,
  deleteAlpacaConnection,
  findAlpacaConnection,
  insertAlpacaConnection,
  listAlpacaConnections,
  markAlpacaConnectionInvalid,
  renameAlpacaConnection,
  replaceAlpacaConnectionKeys,
  updateAlpacaConnectionStatus,
} from '@workspace/db/queries/alpaca-connections'
import {
  findFallbackConnectionId,
  setMemberActiveConnection,
  setWorkspaceDefaultConnection,
} from '@workspace/db/queries/workspaces'
import { z } from 'zod'

import { AlpacaApiError, getAccount } from '@/lib/alpaca/client'
import { maskKeyId } from '@/lib/alpaca/mask-key-id'
import {
  type AlpacaClientOptions,
  alpacaEnvironmentSchema,
} from '@/lib/alpaca/schemas'
import {
  credentialAad,
  decryptSecret,
  encryptSecret,
  parseEncryptionKeys,
} from '@/lib/crypto/secret-box'
import { env } from '@/lib/env'
import {
  type ActiveWorkspace,
  assertWorkspaceOwner,
} from '@/lib/workspaces/workspace'

const connectionStatusSchema = z.enum(['unverified', 'valid', 'invalid'])

export const connectionNameSchema = z.string().trim().min(1).max(40)

export const keyMaterialSchema = z.object({
  keyId: z.string().trim().min(8).max(128),
  secret: z.string().trim().min(8).max(256),
})

export const maskedConnectionSchema = z.object({
  environment: alpacaEnvironmentSchema,
  id: z.string(),
  keyIdMasked: z.string(),
  lastVerifiedAt: z.iso.datetime().nullable(),
  name: z.string(),
  status: connectionStatusSchema,
})

export type MaskedConnection = z.infer<typeof maskedConnectionSchema>

type Fetcher = typeof fetch

interface AddConnectionInput {
  environment: 'live' | 'paper'
  fetcher?: Fetcher
  keyId: string
  name: string
  secret: string
  workspace: ActiveWorkspace
}

interface ReplaceConnectionKeysInput {
  connectionId: string
  fetcher?: Fetcher
  keyId: string
  secret: string
  workspace: ActiveWorkspace
}

interface ConnectionActionInput {
  connectionId: string
  workspace: ActiveWorkspace
}

interface TestConnectionInput extends ConnectionActionInput {
  fetcher?: Fetcher
}

interface RenameConnectionInput extends ConnectionActionInput {
  name: string
}

interface MarkConnectionInvalidInput {
  connectionId: string
  updatedAt?: Date
  workspaceId: string
}

/** Everything an API route needs to call Alpaca and record what it did. */
export type AlpacaRequestContext = {
  actor: ActivityActor & { connectionId: string; connectionName: string }
  alpaca: AlpacaClientOptions & { environment: 'live' | 'paper' }
  connectionUpdatedAt: Date
}

/** Raised when the active connection is missing, rejected or not in this workspace. */
export class AlpacaCredentialsError extends Error {
  readonly code: 'INVALID' | 'MISSING'

  constructor(code: 'INVALID' | 'MISSING') {
    super(
      code === 'MISSING'
        ? 'An Alpaca connection is required.'
        : 'The Alpaca connection is invalid.'
    )
    this.name = 'AlpacaCredentialsError'
    this.code = code
  }
}

/** Raised when another connection in the workspace already uses the name. */
export class ConnectionNameTakenError extends Error {
  constructor() {
    super('A connection with that name already exists.')
    this.name = 'ConnectionNameTakenError'
  }
}

/**
 * Checks a key pair against Alpaca, then stores it as a new named connection.
 * The first connection of a workspace becomes its default.
 * The returned value is masked and never includes the secret.
 */
export async function addConnection(
  input: AddConnectionInput
): Promise<MaskedConnection> {
  assertWorkspaceOwner(input.workspace)

  const name = connectionNameSchema.parse(input.name)
  const environment = alpacaEnvironmentSchema.parse(input.environment)
  const keys = keyMaterialSchema.parse(input)

  await verifyKeys({ ...keys, environment, fetcher: input.fetcher })

  const id = crypto.randomUUID()
  let row: AlpacaConnectionRow

  try {
    row = await insertAlpacaConnection({
      createdByUserId: input.workspace.userId,
      environment,
      id,
      keyIdCiphertext: encryptField({
        connectionId: id,
        environment,
        field: 'keyId',
        plaintext: keys.keyId,
      }),
      keyIdLast4: keys.keyId.slice(-4),
      lastVerifiedAt: new Date(),
      name,
      secretCiphertext: encryptField({
        connectionId: id,
        environment,
        field: 'secret',
        plaintext: keys.secret,
      }),
      workspaceId: input.workspace.workspaceId,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConnectionNameTakenError()
    }

    throw error
  }

  if (!input.workspace.defaultConnectionId) {
    await setWorkspaceDefaultConnection({
      connectionId: id,
      workspaceId: input.workspace.workspaceId,
    })
  }

  return toMaskedConnection(row, keys.keyId)
}

/** Checks a new key pair for an existing connection, then swaps it in. */
export async function replaceConnectionKeys(
  input: ReplaceConnectionKeysInput
): Promise<MaskedConnection> {
  assertWorkspaceOwner(input.workspace)

  const row = await requireConnection(input)
  const environment = alpacaEnvironmentSchema.parse(row.environment)
  const keys = keyMaterialSchema.parse(input)

  await verifyKeys({ ...keys, environment, fetcher: input.fetcher })

  const updated = await replaceAlpacaConnectionKeys({
    id: row.id,
    keyIdCiphertext: encryptField({
      connectionId: row.id,
      environment,
      field: 'keyId',
      plaintext: keys.keyId,
    }),
    keyIdLast4: keys.keyId.slice(-4),
    lastVerifiedAt: new Date(),
    secretCiphertext: encryptField({
      connectionId: row.id,
      environment,
      field: 'secret',
      plaintext: keys.secret,
    }),
    workspaceId: row.workspaceId,
  })

  if (!updated) {
    throw new AlpacaCredentialsError('MISSING')
  }

  return toMaskedConnection(updated, keys.keyId)
}

/** Decrypts a stored key pair, calls Alpaca, and records the result. */
export async function testConnection(
  input: TestConnectionInput
): Promise<MaskedConnection> {
  const row = await requireConnection(input)
  const { apiKeyId, apiSecretKey, environment } = decryptConnection(row)

  try {
    await getAccount({
      apiKeyId,
      apiSecretKey,
      environment,
      fetcher: input.fetcher,
    })
  } catch (error) {
    if (isRejectedCredential(error)) {
      await markAlpacaConnectionInvalid({
        id: row.id,
        workspaceId: row.workspaceId,
      })
      throw new AlpacaCredentialsError('INVALID')
    }

    throw error
  }

  const verifiedAt = new Date()
  await updateAlpacaConnectionStatus({
    id: row.id,
    lastVerifiedAt: verifiedAt,
    status: 'valid',
    workspaceId: row.workspaceId,
  })

  return toMaskedConnection(
    { ...row, lastVerifiedAt: verifiedAt, status: 'valid' },
    apiKeyId
  )
}

/** Renames a connection. Names are unique per workspace, ignoring case. */
export async function renameConnection(
  input: RenameConnectionInput
): Promise<void> {
  assertWorkspaceOwner(input.workspace)

  const row = await requireConnection(input)

  try {
    await renameAlpacaConnection({
      id: row.id,
      name: connectionNameSchema.parse(input.name),
      workspaceId: row.workspaceId,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConnectionNameTakenError()
    }

    throw error
  }
}

/**
 * Deletes a connection. When it was the default, the oldest paper connection
 * (else the oldest live one) takes over. Members who had picked it fall back
 * to the default.
 */
export async function removeConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  assertWorkspaceOwner(input.workspace)

  const row = await requireConnection(input)
  await deleteAlpacaConnection({ id: row.id, workspaceId: row.workspaceId })

  if (input.workspace.defaultConnectionId === row.id) {
    await setWorkspaceDefaultConnection({
      connectionId: (await findFallbackConnectionId(row.workspaceId)) ?? null,
      workspaceId: row.workspaceId,
    })
  }

  return row
}

/** Picks the connection this member trades with. Any member can switch. */
export async function setActiveConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  const row = await requireConnection(input)

  if (row.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  await setMemberActiveConnection({
    connectionId: row.id,
    userId: input.workspace.userId,
    workspaceId: row.workspaceId,
  })

  return row
}

/** Makes a valid connection the workspace default. Owners only. */
export async function setDefaultConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  assertWorkspaceOwner(input.workspace)

  const row = await requireConnection(input)

  if (row.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  await setWorkspaceDefaultConnection({
    connectionId: row.id,
    workspaceId: row.workspaceId,
  })

  return row
}

/** Marks a connection invalid after Alpaca rejects it during a request. */
export async function markConnectionInvalid(
  input: MarkConnectionInvalidInput
): Promise<void> {
  await markAlpacaConnectionInvalid({
    id: input.connectionId,
    updatedAt: input.updatedAt,
    workspaceId: input.workspaceId,
  })
}

/** Lists masked connection metadata for a workspace. Secrets stay on the server. */
export async function listMaskedConnections(
  workspaceId: string
): Promise<MaskedConnection[]> {
  const rows = await listAlpacaConnections(workspaceId)

  return rows.flatMap((row) => {
    const environment = alpacaEnvironmentSchema.safeParse(row.environment)
    const status = connectionStatusSchema.safeParse(row.status)

    if (!environment.success || !status.success) {
      return []
    }

    let keyId: string | undefined

    try {
      keyId = decryptConnection(row).apiKeyId
    } catch {
      keyId = undefined
    }

    return [toMaskedConnection(row, keyId)]
  })
}

/**
 * Returns the id of the connection this member trades with: their own pick,
 * else the workspace default.
 */
export function activeConnectionId(
  workspace: ActiveWorkspace
): string | undefined {
  return (
    workspace.activeConnectionId ?? workspace.defaultConnectionId ?? undefined
  )
}

/**
 * Decrypts the member's active connection for an Alpaca call.
 * Throws when there is none or Alpaca rejected it.
 */
export async function resolveAlpacaRequestContext(
  workspace: ActiveWorkspace
): Promise<AlpacaRequestContext> {
  const connectionId = activeConnectionId(workspace)

  if (!connectionId) {
    throw new AlpacaCredentialsError('MISSING')
  }

  const row = await findAlpacaConnection({
    id: connectionId,
    workspaceId: workspace.workspaceId,
  })

  if (!row) {
    throw new AlpacaCredentialsError('MISSING')
  }

  if (row.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  const alpaca = decryptConnection(row)

  return {
    actor: {
      connectionId: row.id,
      connectionName: row.name,
      environment: alpaca.environment,
      userId: workspace.userId,
      workspaceId: workspace.workspaceId,
    },
    alpaca,
    connectionUpdatedAt: row.updatedAt,
  }
}

/** Builds an activity actor for a connection-scoped action outside an API route. */
export function connectionActor(
  workspace: ActiveWorkspace,
  connection: Pick<AlpacaConnectionRow, 'environment' | 'id' | 'name'>
): ActivityActor {
  return {
    connectionId: connection.id,
    connectionName: connection.name,
    environment: connection.environment === 'live' ? 'live' : 'paper',
    userId: workspace.userId,
    workspaceId: workspace.workspaceId,
  }
}

/** Loads a connection and checks that it belongs to the workspace. */
async function requireConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  const row = await findAlpacaConnection({
    id: z.string().min(1).parse(input.connectionId),
    workspaceId: input.workspace.workspaceId,
  })

  if (!row) {
    throw new AlpacaCredentialsError('MISSING')
  }

  return row
}

interface VerifyKeysInput {
  environment: 'live' | 'paper'
  fetcher?: Fetcher
  keyId: string
  secret: string
}

/** Asks Alpaca to accept a key pair before anything is stored. */
async function verifyKeys(input: VerifyKeysInput): Promise<void> {
  try {
    await getAccount({
      apiKeyId: input.keyId,
      apiSecretKey: input.secret,
      environment: input.environment,
      fetcher: input.fetcher,
    })
  } catch (error) {
    if (isRejectedCredential(error)) {
      throw new AlpacaCredentialsError('INVALID')
    }

    throw error
  }
}

/** Decrypts both key fields of a connection row. */
function decryptConnection(row: AlpacaConnectionRow): AlpacaClientOptions & {
  environment: 'live' | 'paper'
} {
  const environment = alpacaEnvironmentSchema.parse(row.environment)

  return {
    apiKeyId: decryptField({
      ciphertext: row.keyIdCiphertext,
      connectionId: row.id,
      environment,
      field: 'keyId',
    }),
    apiSecretKey: decryptField({
      ciphertext: row.secretCiphertext,
      connectionId: row.id,
      environment,
      field: 'secret',
    }),
    environment,
  }
}

interface EncryptFieldInput {
  connectionId: string
  environment: 'live' | 'paper'
  field: 'keyId' | 'secret'
  plaintext: string
}

/** Encrypts one key field with AAD bound to its connection. */
function encryptField(input: EncryptFieldInput): string {
  return encryptSecret({
    aad: credentialAad(input),
    keys: parseEncryptionKeys(env.CREDENTIALS_ENCRYPTION_KEYS),
    plaintext: input.plaintext,
  })
}

interface DecryptFieldInput {
  ciphertext: string
  connectionId: string
  environment: 'live' | 'paper'
  field: 'keyId' | 'secret'
}

/** Decrypts one key field. Failures stay generic and are not logged. */
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

/** Builds the only connection shape allowed to leave the server. */
function toMaskedConnection(
  row: AlpacaConnectionRow,
  keyId: string | undefined
): MaskedConnection {
  return maskedConnectionSchema.parse({
    environment: row.environment,
    id: row.id,
    keyIdMasked: keyId ? maskKeyId(keyId) : `••••${row.keyIdLast4}`,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    name: row.name,
    status: row.status,
  })
}

/** Alpaca 401 means the stored key id or secret was rejected. */
function isRejectedCredential(error: unknown): boolean {
  return error instanceof AlpacaApiError && error.status === 401
}

/** Postgres 23505: the per-workspace name index rejected a duplicate. */
function isUniqueViolation(error: unknown): boolean {
  const cause =
    error instanceof Error && 'cause' in error ? error.cause : undefined

  return [error, cause].some(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      value.code === '23505'
  )
}
