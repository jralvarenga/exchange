import { and, asc, eq } from 'drizzle-orm'

import { db } from '../client'
import { alpacaConnections } from '../schema/alpaca-connections'

export type AlpacaConnectionRow = typeof alpacaConnections.$inferSelect

export type AlpacaConnectionStatus = 'invalid' | 'unverified' | 'valid'

interface ConnectionIdentity {
  id: string
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

/** Stores a new, already verified connection in a workspace. */
export async function insertAlpacaConnection(
  input: InsertAlpacaConnectionInput
): Promise<AlpacaConnectionRow> {
  const now = new Date()
  const [row] = await db
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
    .returning()

  if (!row) {
    throw new Error('Alpaca connection could not be saved.')
  }

  return row
}

/** Replaces the encrypted key pair of an existing connection and marks it valid. */
export async function replaceAlpacaConnectionKeys(
  input: ReplaceAlpacaConnectionKeysInput
): Promise<AlpacaConnectionRow | undefined> {
  const [row] = await db
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
    .returning()

  return row
}

/** Returns one connection when it belongs to the workspace. */
export async function findAlpacaConnection(
  input: ConnectionIdentity
): Promise<AlpacaConnectionRow | undefined> {
  const [row] = await db
    .select()
    .from(alpacaConnections)
    .where(connectionWhere(input))
    .limit(1)

  return row
}

/** Lists a workspace's connections, oldest first. */
export async function listAlpacaConnections(
  workspaceId: string
): Promise<AlpacaConnectionRow[]> {
  return db
    .select()
    .from(alpacaConnections)
    .where(eq(alpacaConnections.workspaceId, workspaceId))
    .orderBy(asc(alpacaConnections.createdAt))
}

/** Deletes one connection from a workspace. */
export async function deleteAlpacaConnection(
  input: ConnectionIdentity
): Promise<void> {
  await db.delete(alpacaConnections).where(connectionWhere(input))
}

/** Renames one connection. */
export async function renameAlpacaConnection(
  input: RenameAlpacaConnectionInput
): Promise<void> {
  await db
    .update(alpacaConnections)
    .set({ name: input.name, updatedAt: new Date() })
    .where(connectionWhere(input))
}

/** Records the result of a check against Alpaca without touching ciphertext. */
export async function updateAlpacaConnectionStatus(
  input: UpdateAlpacaConnectionStatusInput
): Promise<void> {
  await db
    .update(alpacaConnections)
    .set({
      lastVerifiedAt: input.lastVerifiedAt,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(connectionWhere(input))
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

  await db
    .update(alpacaConnections)
    .set({ status: 'invalid', updatedAt: new Date() })
    .where(and(...conditions))
}

/** Matches one connection inside one workspace. */
function connectionWhere(input: ConnectionIdentity) {
  return and(
    eq(alpacaConnections.id, input.id),
    eq(alpacaConnections.workspaceId, input.workspaceId)
  )
}
