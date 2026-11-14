import path from 'node:path'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(path.resolve('apps/web'))

const dryRun = process.argv.includes('--dry-run')

await rewrapCredentials()

type ScriptEnvName =
  | 'CREDENTIALS_ENCRYPTION_KEYS'
  | 'DATABASE_MIGRATOR_URL'
  | 'DATABASE_URL'

/** Reads one of the env values this script uses; blank counts as unset. */
function readEnv(name: ScriptEnvName): string | undefined {
  return process.env[name] || undefined
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
 * cannot read ciphertext. Safe to rerun; a row changed meanwhile is skipped.
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
    const { rows } = await pool.query<CredentialRow>(
      `SELECT id, workspace_id, environment, key_id_ciphertext, secret_ciphertext
       FROM alpaca_connections ORDER BY created_at`
    )
    let rewrapped = 0
    let failed = 0

    for (const row of rows) {
      const stale =
        needsRewrap({ keys, payload: row.key_id_ciphertext }) ||
        needsRewrap({ keys, payload: row.secret_ciphertext })

      if (!stale) {
        continue
      }

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
        failed += 1
        console.error(
          `Connection ${row.id} could not be decrypted; left unchanged.`
        )
        continue
      }

      if (dryRun) {
        rewrapped += 1
        continue
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

      if (result.rowCount === 1) {
        rewrapped += 1
      } else {
        console.log(`Connection ${row.id} changed during the run; skipped.`)
      }
    }

    console.log(
      `${dryRun ? 'Would rewrap' : 'Rewrapped'} ${rewrapped} of ${rows.length} connections.${failed > 0 ? ` ${failed} could not be decrypted.` : ''}`
    )

    if (failed > 0) {
      process.exitCode = 1
    }
  } finally {
    await pool.end()
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
