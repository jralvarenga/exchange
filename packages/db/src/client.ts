import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { alpacaCredentials } from './schema/alpaca-credentials'
import * as authSchema from './schema/auth'
import { cryptoWallets } from './schema/crypto-wallets'

/**
 * Shared Postgres pool for compose locally and Neon's pooled connection string.
 * The pool connects on the first query.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const schema = {
  ...authSchema,
  alpacaCredentials,
  cryptoWallets,
}

/** Drizzle client with snake_case columns for compose Postgres and Neon. */
export const db = drizzle(pool, {
  casing: 'snake_case',
  schema,
})

export { pool }
