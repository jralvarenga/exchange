import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loadEnvConfig } from '@next/env'
import { parse } from 'dotenv'

// Same precedence as drizzle.config.ts: the process, then packages/db/.env,
// then apps/web/.env.local.
const processEnv = { ...process.env }
const databasePackageEnv = readEnvFile(path.resolve('packages/db/.env'))

loadEnvConfig(path.resolve('apps/web'))

const dryRun = process.argv.includes('--dry-run')
const MAX_PASSES = 3

await rewrapCredentials()

type ScriptEnvName =
  | 'CREDENTIALS_ENCRYPTION_KEYS'
  | 'DATABASE_MIGRATOR_URL'
  | 'DATABASE_URL'

/**
 * Reads one of the env values this script uses, in drizzle.config.ts order.
 * Blank counts as unset.
 */
function readEnv(name: ScriptEnvName): string | undefined {
  return (
    processEnv[name] ||
    databasePackageEnv[name] ||
    process.env[name] ||
    undefined
  )
}

/** Parses a KEY=VALUE env file, or returns nothing when it does not exist. */
function readEnvFile(file: string): Record<string, string> {
  return existsSync(file) ? parse(readFileSync(file, 'utf8')) : {}
}

type CredentialRow = {
  environment: string
  id: string
  key_id_ciphertext: string
  secret_ciphertext: string
  workspace_id: string
}

/**
 * Re-encrypts every stored Alpaca key that uses an older box version or a key
 * other than the first in CREDENTIALS_ENCRYPTION_KEYS. Afterwards every row is
 * `v2`, bound to its workspace, under the primary key, and retired keys can be
 * removed from the environment. Runs as the table owner, because the app role
 * cannot read ciphertext. A row saved meanwhile is re-read and retried, and the
 * run exits non-zero if any row still needs rewrapping. Safe to rerun.
 */
async function rewrapCredentials(): Promise<void> {
  const { Pool } = await import('pg')
  const { normalizeDatabaseUrl } = await import('../packages/db/src/utils')
  const {
    decryptCredential,
    encryptCredential,
    needsRewrap,
    parseEncryptionKeys,
  } = await import('../apps/web/lib/crypto/secret-box-core')

  const databaseUrl =
    readEnv('DATABASE_MIGRATOR_URL') ?? readEnv('DATABASE_URL')

  if (!databaseUrl) {
    throw new Error('DATABASE_MIGRATOR_URL or DATABASE_URL is required.')
  }

  const keys = parseEncryptionKeys(readEnv('CREDENTIALS_ENCRYPTION_KEYS') ?? '')
  const pool = new Pool({ connectionString: normalizeDatabaseUrl(databaseUrl) })

  try {
    const undecryptable = new Set<string>()
    let rewrapped = 0
    let total = 0

    // A row an app instance saves meanwhile is re-read on the next pass.
    for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
      const rows = await listCredentialRows()
      const pending = rows.filter(
        (row) => isStale(row) && !undecryptable.has(row.id)
      )
      total = rows.length

      if (pending.length === 0) {
        break
      }

      let changed = 0

      for (const row of pending) {
        const result = await rewrapRow(row)

        if (result === 'failed') {
          undecryptable.add(row.id)
          console.error(
            `Connection ${row.id} could not be decrypted; left unchanged.`
          )
        } else if (result === 'changed') {
          changed += 1
        } else {
          rewrapped += 1
        }
      }

      if (dryRun || changed === 0) {
        break
      }

      console.log(
        `${changed} connections changed during pass ${pass}; retrying.`
      )
    }

    // Verify instead of trusting the counters: any row still on an old box or
    // key would become unreadable once that key is removed.
    const remaining = dryRun
      ? 0
      : (await listCredentialRows()).filter(isStale).length

    console.log(
      `${dryRun ? 'Would rewrap' : 'Rewrapped'} ${rewrapped} of ${total} connections.${undecryptable.size > 0 ? ` ${undecryptable.size} could not be decrypted.` : ''}`
    )

    if (remaining > 0) {
      console.error(
        `${remaining} connections still need rewrapping. Make sure every app instance runs with the new primary key, then rerun. Do not remove the old key yet.`
      )
    }

    if (undecryptable.size > 0 || remaining > 0) {
      process.exitCode = 1
    }
  } finally {
    await pool.end()
  }

  /** Reads every connection's ciphertext as the table owner. */
  async function listCredentialRows(): Promise<CredentialRow[]> {
    const { rows } = await pool.query<CredentialRow>(
      `SELECT id, workspace_id, environment, key_id_ciphertext, secret_ciphertext
       FROM alpaca_connections ORDER BY created_at`
    )

    return rows
  }

  /** True when either field uses an old box version or a non-primary key. */
  function isStale(row: CredentialRow): boolean {
    return (
      needsRewrap({ keys, payload: row.key_id_ciphertext }) ||
      needsRewrap({ keys, payload: row.secret_ciphertext })
    )
  }

  /**
   * Re-encrypts one row unless it changed since it was read. In a dry run
   * nothing is written.
   */
  async function rewrapRow(
    row: CredentialRow
  ): Promise<'changed' | 'failed' | 'rewrapped'> {
    const binding = {
      connectionId: row.id,
      environment: row.environment,
      workspaceId: row.workspace_id,
    }
    let keyIdCiphertext: string
    let secretCiphertext: string

    try {
      keyIdCiphertext = rewrap({
        binding: { ...binding, field: 'keyId' },
        payload: row.key_id_ciphertext,
      })
      secretCiphertext = rewrap({
        binding: { ...binding, field: 'secret' },
        payload: row.secret_ciphertext,
      })
    } catch {
      return 'failed'
    }

    if (dryRun) {
      return 'rewrapped'
    }

    // updated_at stays: it guards "mark invalid" against newer key saves.
    const result = await pool.query(
      `UPDATE alpaca_connections
       SET key_id_ciphertext = $2, secret_ciphertext = $3
       WHERE id = $1 AND key_id_ciphertext = $4 AND secret_ciphertext = $5`,
      [
        row.id,
        keyIdCiphertext,
        secretCiphertext,
        row.key_id_ciphertext,
        row.secret_ciphertext,
      ]
    )

    return result.rowCount === 1 ? 'rewrapped' : 'changed'
  }

  interface RewrapInput {
    binding: Parameters<typeof encryptCredential>[0]['binding']
    payload: string
  }

  /** Decrypts one field with its current box and encrypts it as `v2`. */
  function rewrap(input: RewrapInput): string {
    return encryptCredential({
      binding: input.binding,
      keys,
      plaintext: decryptCredential({ ...input, keys }),
    })
  }
}
