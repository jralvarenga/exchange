import { and, eq } from 'drizzle-orm'

import { db } from '../client'
import { alpacaCredentials } from '../schema/alpaca-credentials'
import { users } from '../schema/auth'

export type AlpacaCredentialRow = typeof alpacaCredentials.$inferSelect

interface AlpacaCredentialIdentity {
  environment: string
  userId: string
}

interface UpsertAlpacaCredentialInput extends AlpacaCredentialIdentity {
  id: string
  keyIdCiphertext: string
  keyIdLast4: string
  lastVerifiedAt: Date
  secretCiphertext: string
  status: 'invalid' | 'unverified' | 'valid'
}

interface UpdateAlpacaCredentialStatusInput extends AlpacaCredentialIdentity {
  lastVerifiedAt: Date | null
  status: 'invalid' | 'unverified' | 'valid'
}

/** Inserts or replaces the encrypted key pair for one user and environment. */
export async function upsertAlpacaCredential(
  input: UpsertAlpacaCredentialInput
): Promise<AlpacaCredentialRow> {
  const now = new Date()
  const [row] = await db
    .insert(alpacaCredentials)
    .values({
      createdAt: now,
      environment: input.environment,
      id: input.id,
      keyIdCiphertext: input.keyIdCiphertext,
      keyIdLast4: input.keyIdLast4,
      lastVerifiedAt: input.lastVerifiedAt,
      secretCiphertext: input.secretCiphertext,
      status: input.status,
      updatedAt: now,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        keyIdCiphertext: input.keyIdCiphertext,
        keyIdLast4: input.keyIdLast4,
        lastVerifiedAt: input.lastVerifiedAt,
        secretCiphertext: input.secretCiphertext,
        status: input.status,
        updatedAt: now,
      },
      target: [alpacaCredentials.userId, alpacaCredentials.environment],
    })
    .returning()

  if (!row) {
    throw new Error('Alpaca credential could not be saved.')
  }

  return row
}

/** Returns the encrypted credential row for one user and environment. */
export async function findAlpacaCredential(
  input: AlpacaCredentialIdentity
): Promise<AlpacaCredentialRow | undefined> {
  const [row] = await db
    .select()
    .from(alpacaCredentials)
    .where(
      and(
        eq(alpacaCredentials.userId, input.userId),
        eq(alpacaCredentials.environment, input.environment)
      )
    )
    .limit(1)

  return row
}

/** Lists encrypted credential rows owned by one user. */
export async function listAlpacaCredentials(
  userId: string
): Promise<AlpacaCredentialRow[]> {
  return db
    .select()
    .from(alpacaCredentials)
    .where(eq(alpacaCredentials.userId, userId))
}

/** Deletes one user's credential for an environment. */
export async function deleteAlpacaCredential(
  input: AlpacaCredentialIdentity
): Promise<void> {
  await db
    .delete(alpacaCredentials)
    .where(
      and(
        eq(alpacaCredentials.userId, input.userId),
        eq(alpacaCredentials.environment, input.environment)
      )
    )
}

/** Records a successful or failed Alpaca check without returning ciphertext. */
export async function updateAlpacaCredentialStatus(
  input: UpdateAlpacaCredentialStatusInput
): Promise<void> {
  await db
    .update(alpacaCredentials)
    .set({
      lastVerifiedAt: input.lastVerifiedAt,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(alpacaCredentials.userId, input.userId),
        eq(alpacaCredentials.environment, input.environment)
      )
    )
}

interface MarkAlpacaCredentialInvalidInput extends AlpacaCredentialIdentity {
  updatedAt?: Date
}

/** Marks a stored key pair invalid without changing the last successful check. */
export async function markAlpacaCredentialInvalid(
  input: MarkAlpacaCredentialInvalidInput
): Promise<void> {
  const conditions = [
    eq(alpacaCredentials.userId, input.userId),
    eq(alpacaCredentials.environment, input.environment),
  ]

  if (input.updatedAt) {
    conditions.push(eq(alpacaCredentials.updatedAt, input.updatedAt))
  }

  await db
    .update(alpacaCredentials)
    .set({
      status: 'invalid',
      updatedAt: new Date(),
    })
    .where(and(...conditions))
}

/** Reads the trading environment selected for a user. */
export async function findUserAlpacaEnvironment(
  userId: string
): Promise<'live' | 'paper' | undefined> {
  const [row] = await db
    .select({
      activeAlpacaEnvironment: users.activeAlpacaEnvironment,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row) {
    return undefined
  }

  return row.activeAlpacaEnvironment === 'live' ? 'live' : 'paper'
}

/** Sets the trading environment used for this user's Alpaca calls. */
export async function updateUserAlpacaEnvironment(input: {
  environment: 'live' | 'paper'
  userId: string
}): Promise<void> {
  await db
    .update(users)
    .set({
      activeAlpacaEnvironment: input.environment,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
}
