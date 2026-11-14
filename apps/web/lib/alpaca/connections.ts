import 'server-only'

import type {
  ActivityActor,
  ConnectionActor,
} from '@workspace/db/queries/activity'
import {
  type AlpacaConnectionPublicRow,
  type AlpacaConnectionRow,
  type AlpacaCredentialPurpose,
  findAlpacaConnection,
  insertAlpacaConnection,
  listAlpacaConnectionPublicRows,
  markAlpacaConnectionInvalid,
  readAlpacaCredentials,
  renameAlpacaConnection,
  replaceAlpacaConnectionKeys,
  updateAlpacaConnectionStatus,
} from '@workspace/db/queries/alpaca-connections'
import {
  deleteConnectionAndRepairDefault,
  setDefaultConnectionIfUnset,
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
  decryptCredential,
  encryptCredential,
  parseEncryptionKeys,
} from '@/lib/crypto/secret-box'
import { env } from '@/lib/env'
import { canTestConnection } from '@/lib/workspaces/permissions'
import {
  type ActiveWorkspace,
  assertWorkspaceManager,
  WorkspacePermissionError,
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
  userId: string
  workspaceId: string
}

interface ListMaskedConnectionsInput {
  userId: string
  workspaceId: string
}

/** Everything an API route needs to call Alpaca and record what it did. */
export type AlpacaRequestContext = {
  actor: ConnectionActor & { connectionId: string; connectionName: string }
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
  assertWorkspaceManager(input.workspace)

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
        workspaceId: input.workspace.workspaceId,
      }),
      keyIdLast4: keys.keyId.slice(-4),
      lastVerifiedAt: new Date(),
      name,
      secretCiphertext: encryptField({
        connectionId: id,
        environment,
        field: 'secret',
        plaintext: keys.secret,
        workspaceId: input.workspace.workspaceId,
      }),
      userId: input.workspace.userId,
      workspaceId: input.workspace.workspaceId,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConnectionNameTakenError()
    }

    throw error
  }

  // A no-op unless the workspace still has no default when this lands.
  await setDefaultConnectionIfUnset({
    connectionId: id,
    workspaceId: input.workspace.workspaceId,
  })

  return toMaskedConnection(row, keys.keyId)
}

/** Checks a new key pair for an existing connection, then swaps it in. */
export async function replaceConnectionKeys(
  input: ReplaceConnectionKeysInput
): Promise<MaskedConnection> {
  assertWorkspaceManager(input.workspace)

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
      workspaceId: row.workspaceId,
    }),
    keyIdLast4: keys.keyId.slice(-4),
    lastVerifiedAt: new Date(),
    secretCiphertext: encryptField({
      connectionId: row.id,
      environment,
      field: 'secret',
      plaintext: keys.secret,
      workspaceId: row.workspaceId,
    }),
    userId: input.workspace.userId,
    workspaceId: row.workspaceId,
  })

  if (!updated) {
    throw new AlpacaCredentialsError('MISSING')
  }

  return toMaskedConnection(updated, keys.keyId)
}

/** Decrypts a stored key pair, calls Alpaca, and records the result. Not for viewers. */
export async function testConnection(
  input: TestConnectionInput
): Promise<MaskedConnection> {
  if (!canTestConnection(input.workspace.role)) {
    throw new WorkspacePermissionError('Viewers cannot test connections.')
  }

  const row = await requireConnection(input)
  const { apiKeyId, apiSecretKey, environment } = await decryptConnection({
    purpose: 'test',
    row,
    userId: input.workspace.userId,
  })

  try {
    await getAccount({
      apiKeyId,
      apiSecretKey,
      environment,
      fetcher: input.fetcher,
    })
  } catch (error) {
    if (isRejectedCredential(error)) {
      // Only the keys that were tested: a replacement saved since stays valid.
      await markAlpacaConnectionInvalid({
        id: row.id,
        updatedAt: row.updatedAt,
        userId: input.workspace.userId,
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
    userId: input.workspace.userId,
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
  assertWorkspaceManager(input.workspace)

  const row = await requireConnection(input)

  try {
    await renameAlpacaConnection({
      id: row.id,
      name: connectionNameSchema.parse(input.name),
      userId: input.workspace.userId,
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
 * Deletes a connection. When it was the default, the oldest valid paper
 * connection (else the oldest valid live one) takes over. Members who had
 * picked it fall back to the default.
 */
export async function removeConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  assertWorkspaceManager(input.workspace)

  const row = await requireConnection(input)
  await deleteConnectionAndRepairDefault({
    connectionId: row.id,
    userId: input.workspace.userId,
    workspaceId: row.workspaceId,
  })

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

/** Makes a valid connection the workspace default. Owners and admins. */
export async function setDefaultConnection(
  input: ConnectionActionInput
): Promise<AlpacaConnectionRow> {
  assertWorkspaceManager(input.workspace)

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
    userId: input.userId,
    workspaceId: input.workspaceId,
  })
}

/**
 * Lists masked connection metadata for a workspace. Ciphertext is never
 * selected. The shell only uses id, name, environment and status; the Account
 * page shows `keyIdMasked` built from the stored last four characters.
 */
export async function listMaskedConnections(
  input: ListMaskedConnectionsInput
): Promise<MaskedConnection[]> {
  const rows = await listAlpacaConnectionPublicRows(input)

  return rows.flatMap((row) => {
    const environment = alpacaEnvironmentSchema.safeParse(row.environment)
    const status = connectionStatusSchema.safeParse(row.status)

    if (!environment.success || !status.success) {
      return []
    }

    return [toMaskedConnection(row)]
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
 * Loads the member's active connection without decrypting keys. Throws when
 * there is none or Alpaca has already rejected it.
 */
export async function loadActiveAlpacaConnection(
  workspace: ActiveWorkspace
): Promise<AlpacaConnectionRow> {
  const connectionId = activeConnectionId(workspace)

  if (!connectionId) {
    throw new AlpacaCredentialsError('MISSING')
  }

  const row = await findAlpacaConnection({
    id: connectionId,
    userId: workspace.userId,
    workspaceId: workspace.workspaceId,
  })

  if (!row) {
    throw new AlpacaCredentialsError('MISSING')
  }

  if (row.status !== 'valid') {
    throw new AlpacaCredentialsError('INVALID')
  }

  return row
}

interface DecryptAlpacaRequestContextInput {
  purpose: Exclude<AlpacaCredentialPurpose, 'test'>
  row: AlpacaConnectionRow
  workspace: ActiveWorkspace
}

/**
 * Decrypts a loaded active connection for an Alpaca call and records the use.
 * Trading routes must apply `tradeLock` before calling this so a 403 never
 * unwraps keys.
 */
export async function decryptAlpacaRequestContext(
  input: DecryptAlpacaRequestContextInput
): Promise<AlpacaRequestContext> {
  const alpaca = await decryptConnection({
    purpose: input.purpose,
    row: input.row,
    userId: input.workspace.userId,
  })

  return {
    actor: {
      connectionId: input.row.id,
      connectionName: input.row.name,
      environment: alpaca.environment,
      userId: input.workspace.userId,
      workspaceId: input.workspace.workspaceId,
    },
    alpaca,
    connectionUpdatedAt: input.row.updatedAt,
  }
}

/**
 * Decrypts the member's active connection for an Alpaca call.
 * Throws when there is none or Alpaca rejected it.
 */
export async function resolveAlpacaRequestContext(
  workspace: ActiveWorkspace
): Promise<AlpacaRequestContext> {
  return decryptAlpacaRequestContext({
    purpose: 'read',
    row: await loadActiveAlpacaConnection(workspace),
    workspace,
  })
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
    userId: input.workspace.userId,
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

interface DecryptConnectionInput {
  purpose: AlpacaCredentialPurpose
  row: AlpacaConnectionRow
  userId: string
}

/**
 * Reads a connection's ciphertext through the audited database function and
 * decrypts both key fields.
 */
async function decryptConnection(
  input: DecryptConnectionInput
): Promise<AlpacaClientOptions & { environment: 'live' | 'paper' }> {
  const { row } = input
  const environment = alpacaEnvironmentSchema.parse(row.environment)
  const ciphertexts = await readAlpacaCredentials({
    id: row.id,
    purpose: input.purpose,
    userId: input.userId,
    workspaceId: row.workspaceId,
  })

  if (!ciphertexts) {
    throw new AlpacaCredentialsError('MISSING')
  }

  const binding = {
    connectionId: row.id,
    environment,
    workspaceId: row.workspaceId,
  }

  return {
    apiKeyId: decryptField({
      ...binding,
      ciphertext: ciphertexts.keyIdCiphertext,
      field: 'keyId',
    }),
    apiSecretKey: decryptField({
      ...binding,
      ciphertext: ciphertexts.secretCiphertext,
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
  workspaceId: string
}

/** Encrypts one key field with AAD bound to its workspace and connection. */
function encryptField(input: EncryptFieldInput): string {
  const { plaintext, ...binding } = input

  return encryptCredential({
    binding,
    keys: parseEncryptionKeys(env.CREDENTIALS_ENCRYPTION_KEYS),
    plaintext,
  })
}

interface DecryptFieldInput {
  ciphertext: string
  connectionId: string
  environment: 'live' | 'paper'
  field: 'keyId' | 'secret'
  workspaceId: string
}

/** Decrypts one key field. Failures stay generic and are not logged. */
function decryptField(input: DecryptFieldInput): string {
  const { ciphertext, ...binding } = input

  try {
    return decryptCredential({
      binding,
      keys: parseEncryptionKeys(env.CREDENTIALS_ENCRYPTION_KEYS),
      payload: ciphertext,
    })
  } catch {
    throw new AlpacaCredentialsError('INVALID')
  }
}

/** Builds the only connection shape allowed to leave the server. */
function toMaskedConnection(
  row: AlpacaConnectionPublicRow | AlpacaConnectionRow,
  keyId?: string
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
