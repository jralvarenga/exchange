import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as activitySchema from './schema/activity'
import {
  alpacaConnections,
  alpacaCredentialUses,
} from './schema/alpaca-connections'
import * as authSchema from './schema/auth'
import { cryptoWallets } from './schema/crypto-wallets'
import * as workspaceSchema from './schema/workspaces'
import { normalizeDatabaseUrl } from './utils'

const databaseUrl = process.env.DATABASE_URL

/**
 * Shared Postgres pool for compose locally and Neon's pooled connection string.
 * The pool connects on the first query.
 */
const pool = new Pool({
  connectionString: databaseUrl ? normalizeDatabaseUrl(databaseUrl) : undefined,
})

const schema = {
  ...activitySchema,
  ...authSchema,
  ...workspaceSchema,
  alpacaConnections,
  alpacaCredentialUses,
  cryptoWallets,
}

/** Drizzle client with snake_case columns for compose Postgres and Neon. */
export const db = drizzle(pool, {
  casing: 'snake_case',
  schema,
})

export { pool }
