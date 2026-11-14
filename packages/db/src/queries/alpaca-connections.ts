import { and, asc, eq, sql } from 'drizzle-orm'

import { db } from '../client'
import { withMemberScope } from '../member-scope'
import { alpacaConnections } from '../schema/alpaca-connections'

/**
 * Every connection column except the two ciphertexts. The app role from
 * `sql/app-role.sql` may only select these, so queries must name them.
 */
const connectionColumns = {
  createdAt: alpacaConnections.createdAt,
  createdByUserId: alpacaConnections.createdByUserId,
  environment: alpacaConnections.environment,
  id: alpacaConnections.id,
  keyIdLast4: alpacaConnections.keyIdLast4,
  lastVerifiedAt: alpacaConnections.lastVerifiedAt,
  name: alpacaConnections.name,
  status: alpacaConnections.status,
  updatedAt: alpacaConnections.updatedAt,
  workspaceId: alpacaConnections.workspaceId,
}

/** A stored connection without its encrypted keys. */
export type AlpacaConnectionRow = Omit<
  typeof alpacaConnections.$inferSelect,
  'keyIdCiphertext' | 'secretCiphertext'
>

export type AlpacaConnectionStatus = 'invalid' | 'unverified' | 'valid'

/** Why a request needs a connection's keys, as recorded in the usage audit. */
export type AlpacaCredentialPurpose = 'read' | 'test' | 'trade'

/** The two encrypted key fields of one connection. */
export type AlpacaConnectionCiphertexts = {
  keyIdCiphertext: string
  secretCiphertext: string
}

interface ConnectionIdentity {
  id: string
  /** The acting member. Row-level security only shows their workspaces. */
  userId: string
  workspaceId: string
}

interface ListAlpacaConnectionPublicRowsInput {
  userId: string
  workspaceId: string
}

interface InsertAlpacaConnectionInput extends ConnectionIdentity {
  createdByUserId: string
  environment: 'live' | 'paper'
  keyIdCiphertext: string
  keyIdLast4: string
  lastVerifiedAt: Date
  name: string
  secretCiphertext: string
}

interface ReplaceAlpacaConnectionKeysInput extends ConnectionIdentity {
  keyIdCiphertext: string
  keyIdLast4: string
  lastVerifiedAt: Date
  secretCiphertext: string
}

interface UpdateAlpacaConnectionStatusInput extends ConnectionIdentity {
  lastVerifiedAt: Date | null
  status: AlpacaConnectionStatus
}

interface MarkAlpacaConnectionInvalidInput extends ConnectionIdentity {
  updatedAt?: Date
}

interface RenameAlpacaConnectionInput extends ConnectionIdentity {
  name: string
}

interface ReadAlpacaCredentialsInput extends ConnectionIdentity {
  purpose: AlpacaCredentialPurpose
}

/** Stores a new, already verified connection in a workspace. */
export async function insertAlpacaConnection(
  input: InsertAlpacaConnectionInput
): Promise<AlpacaConnectionRow> {
  const now = new Date()
  const [row] = await withMemberScope(input.userId, (tx) =>
    tx
      .insert(alpacaConnections)
      .values({
        createdAt: now,
        createdByUserId: input.createdByUserId,
        environment: input.environment,
        id: input.id,
        keyIdCiphertext: input.keyIdCiphertext,
        keyIdLast4: input.keyIdLast4,
        lastVerifiedAt: input.lastVerifiedAt,
        name: input.name,
        secretCiphertext: input.secretCiphertext,
        status: 'valid',
        updatedAt: now,
        workspaceId: input.workspaceId,
      })
      .returning(connectionColumns)
  )

  if (!row) {
    throw new Error('Alpaca connection could not be saved.')
  }

  return row
}

/** Replaces the encrypted key pair of an existing connection and marks it valid. */
export async function replaceAlpacaConnectionKeys(
  input: ReplaceAlpacaConnectionKeysInput
): Promise<AlpacaConnectionRow | undefined> {
  const [row] = await withMemberScope(input.userId, (tx) =>
    tx
      .update(alpacaConnections)
      .set({
        keyIdCiphertext: input.keyIdCiphertext,
        keyIdLast4: input.keyIdLast4,
        lastVerifiedAt: input.lastVerifiedAt,
        secretCiphertext: input.secretCiphertext,
        status: 'valid',
        updatedAt: new Date(),
      })
      .where(connectionWhere(input))
      .returning(connectionColumns)
  )

  return row
}

/** Returns one connection, without its keys, when it belongs to the workspace. */
export async function findAlpacaConnection(
  input: ConnectionIdentity
): Promise<AlpacaConnectionRow | undefined> {
  const [row] = await withMemberScope(input.userId, (tx) =>
    tx
      .select(connectionColumns)
      .from(alpacaConnections)
      .where(connectionWhere(input))
      .limit(1)
  )

  return row
}

/**
 * Loads a connection's encrypted keys for one member and records the use.
 * Goes through `read_alpaca_credentials`, which rejects non-members and is the
 * only way the restricted app role can read ciphertext. Check the member's
 * role before calling this: the database only checks membership.
 */
export async function readAlpacaCredentials(
  input: ReadAlpacaCredentialsInput
): Promise<AlpacaConnectionCiphertexts | undefined> {
  const result = await db.execute(
    sql`select key_id_ciphertext, secret_ciphertext from read_alpaca_credentials(${input.id}, ${input.workspaceId}, ${input.userId}, ${input.purpose})`
  )
  const row = result.rows[0]

  if (!row) {
    return undefined
  }

  const keyIdCiphertext = row.key_id_ciphertext
  const secretCiphertext = row.secret_ciphertext

  if (
    typeof keyIdCiphertext !== 'string' ||
    typeof secretCiphertext !== 'string'
  ) {
    throw new Error('Alpaca credentials have an unexpected shape.')
  }

  return { keyIdCiphertext, secretCiphertext }
}

/** Connection fields that can leave the database without exposing keys. */
export type AlpacaConnectionPublicRow = {
  environment: string
  id: string
  keyIdLast4: string
  lastVerifiedAt: Date | null
  name: string
  status: string
}

/**
 * Lists a workspace's connections without ciphertext. Use this for any path
 * that only needs names, status and a key mask.
 */
export async function listAlpacaConnectionPublicRows(
  input: ListAlpacaConnectionPublicRowsInput
): Promise<AlpacaConnectionPublicRow[]> {
  return withMemberScope(input.userId, (tx) =>
    tx
      .select({
        environment: alpacaConnections.environment,
        id: alpacaConnections.id,
        keyIdLast4: alpacaConnections.keyIdLast4,
        lastVerifiedAt: alpacaConnections.lastVerifiedAt,
        name: alpacaConnections.name,
        status: alpacaConnections.status,
      })
      .from(alpacaConnections)
      .where(eq(alpacaConnections.workspaceId, input.workspaceId))
      .orderBy(asc(alpacaConnections.createdAt))
  )
}

/** Deletes one connection from a workspace. */
export async function deleteAlpacaConnection(
  input: ConnectionIdentity
): Promise<void> {
  await withMemberScope(input.userId, (tx) =>
    tx.delete(alpacaConnections).where(connectionWhere(input))
  )
}

/** Renames one connection. */
export async function renameAlpacaConnection(
  input: RenameAlpacaConnectionInput
): Promise<void> {
  await withMemberScope(input.userId, (tx) =>
    tx
      .update(alpacaConnections)
      .set({ name: input.name, updatedAt: new Date() })
      .where(connectionWhere(input))
  )
}

/** Records the result of a check against Alpaca without touching ciphertext. */
export async function updateAlpacaConnectionStatus(
  input: UpdateAlpacaConnectionStatusInput
): Promise<void> {
  await withMemberScope(input.userId, (tx) =>
    tx
      .update(alpacaConnections)
      .set({
        lastVerifiedAt: input.lastVerifiedAt,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(connectionWhere(input))
  )
}

/**
 * Marks a connection invalid after Alpaca rejects it.
 * With `updatedAt`, a newer save made in the meantime is left alone.
 */
export async function markAlpacaConnectionInvalid(
  input: MarkAlpacaConnectionInvalidInput
): Promise<void> {
  const conditions = [connectionWhere(input)]

  if (input.updatedAt) {
    conditions.push(eq(alpacaConnections.updatedAt, input.updatedAt))
  }

  await withMemberScope(input.userId, (tx) =>
    tx
      .update(alpacaConnections)
      .set({ status: 'invalid', updatedAt: new Date() })
      .where(and(...conditions))
  )
}

/** Matches one connection inside one workspace. */
function connectionWhere(input: ConnectionIdentity) {
  return and(
    eq(alpacaConnections.id, input.id),
    eq(alpacaConnections.workspaceId, input.workspaceId)
  )
}
