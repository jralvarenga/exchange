import { sql } from 'drizzle-orm'

import { db } from './client'

/** A Drizzle transaction on the shared client. */
export type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0]

/**
 * Runs queries in a transaction that tells Postgres which member is acting.
 * Row-level security on `alpaca_connections` only shows that member's
 * workspaces, so every query on that table must run inside this scope.
 * `set_config(..., true)` lasts until the transaction ends, so a pooled
 * connection never carries the id into another request.
 */
export async function withMemberScope<T>(
  userId: string,
  run: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await setMemberScope(tx, userId)

    return run(tx)
  })
}

/** Sets the acting member inside a transaction the caller already opened. */
export async function setMemberScope(
  tx: DatabaseTransaction,
  userId: string
): Promise<void> {
  if (userId.length === 0) {
    throw new Error('A member id is required to scope the query.')
  }

  await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`)
}
