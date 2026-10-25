import path from 'node:path'
import { loadEnvConfig } from '@next/env'

import { isValidDepositAddress } from '../apps/web/lib/wallet/deposit-addresses'

loadEnvConfig(path.resolve('apps/web'))

const BCRYPT_HASH = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/u

const email = readEmail(process.argv)

if (!email) {
  console.error('Usage: bun run auth:migrate-owner --email you@example.com')
  process.exit(1)
}

await migrateOwner(email)

/**
 * Creates the deploy owner from the previous password hash and optional Alpaca env keys.
 * Running it again does not duplicate the user or replace a newer password.
 */
async function migrateOwner(ownerEmail: string): Promise<void> {
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous operator password, removed after migration
  const passwordHash = process.env.DASHBOARD_PASSWORD_HASH
  const { and, eq } = await import('drizzle-orm')
  const { db, pool } = await import('../packages/db/src/client')
  const {
    findAlpacaCredential,
    updateUserAlpacaEnvironment,
    upsertAlpacaCredential,
  } = await import('../packages/db/src/queries/alpaca-credentials')
  const { upsertCryptoWallet } = await import(
    '../packages/db/src/queries/crypto-wallets'
  )
  const { accounts, users } = await import('../packages/db/src/schema/auth')
  const { credentialAad, encryptSecret, parseEncryptionKeys } = await import(
    '../apps/web/lib/crypto/secret-box-core'
  )

  try {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required.')
    }

    if (passwordHash && !isUsableBcryptHash(passwordHash)) {
      throw new Error(
        'DASHBOARD_PASSWORD_HASH must be a bcrypt hash with cost 10 or higher to create the owner.'
      )
    }

    const alpaca = readAlpacaEnv()
    const depositAddresses = readDepositAddressEnv()

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, ownerEmail))
      .limit(1)
    const now = new Date()
    let userId = existing[0]?.id

    if (userId && !existing[0]?.emailVerified) {
      // Open sign-up lets anyone register this email unverified. Adopting
      // that account would hand its password the owner's Alpaca keys.
      throw new Error(
        'An unverified account already uses this email. Verify it from the inbox or delete it, then rerun the migration.'
      )
    }

    const storedAlpaca =
      userId && alpaca
        ? await findAlpacaCredential({
            environment: alpaca.environment,
            userId,
          })
        : undefined
    const keys =
      alpaca && !storedAlpaca
        ? parseEncryptionKeys(process.env.CREDENTIALS_ENCRYPTION_KEYS ?? '')
        : undefined

    if (!userId) {
      if (!isUsableBcryptHash(passwordHash)) {
        throw new Error(
          'DASHBOARD_PASSWORD_HASH must be a bcrypt hash with cost 10 or higher to create the owner.'
        )
      }

      userId = crypto.randomUUID()
      await db.insert(users).values({
        activeAlpacaEnvironment: 'paper',
        createdAt: now,
        email: ownerEmail,
        emailVerified: true,
        id: userId,
        name: 'Owner',
        updatedAt: now,
      })
      console.log('Created the owner user.')
    } else {
      console.log('Owner user already exists.')
    }

    const [credentialAccount] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential'))
      )
      .limit(1)

    if (!credentialAccount) {
      if (!isUsableBcryptHash(passwordHash)) {
        throw new Error(
          'DASHBOARD_PASSWORD_HASH must be a bcrypt hash with cost 10 or higher to create the password login.'
        )
      }

      await db.insert(accounts).values({
        accountId: userId,
        createdAt: now,
        id: crypto.randomUUID(),
        password: passwordHash,
        providerId: 'credential',
        updatedAt: now,
        userId,
      })
      console.log('Stored the existing password hash.')
    } else {
      console.log('Password login already exists and was left unchanged.')
    }

    if (alpaca) {
      const currentAlpaca = await findAlpacaCredential({
        environment: alpaca.environment,
        userId,
      })

      if (currentAlpaca) {
        console.log(
          `Alpaca ${alpaca.environment} keys already stored and were left unchanged.`
        )
      } else if (keys) {
        await upsertAlpacaCredential({
          environment: alpaca.environment,
          id: crypto.randomUUID(),
          keyIdCiphertext: encryptSecret({
            aad: credentialAad({
              environment: alpaca.environment,
              field: 'keyId',
              userId,
            }),
            keys,
            plaintext: alpaca.keyId,
          }),
          keyIdLast4: alpaca.keyId.slice(-4),
          lastVerifiedAt: now,
          secretCiphertext: encryptSecret({
            aad: credentialAad({
              environment: alpaca.environment,
              field: 'secret',
              userId,
            }),
            keys,
            plaintext: alpaca.secret,
          }),
          status: 'valid',
          userId,
        })
        await updateUserAlpacaEnvironment({
          environment: alpaca.environment,
          userId,
        })
        console.log(`Stored encrypted Alpaca ${alpaca.environment} keys.`)
      }
    }

    for (const deposit of depositAddresses) {
      await upsertCryptoWallet({
        address: deposit.address,
        asset: deposit.asset,
        chain: deposit.chain,
        id: crypto.randomUUID(),
        userId,
      })
    }

    if (depositAddresses.length > 0) {
      console.log(`Stored ${depositAddresses.length} deposit addresses.`)
    }

    console.log(
      'Owner migration finished. Sign in with the previous password, or use Forgot password.'
    )
  } finally {
    await pool.end()
  }
}

/** Reads `--email you@example.com` or `--email=you@example.com`. */
function readEmail(argv: string[]): string | undefined {
  const inline = argv.find((arg) => arg.startsWith('--email='))

  if (inline) {
    return normalizeEmail(inline.slice('--email='.length))
  }

  const index = argv.indexOf('--email')
  const value = index >= 0 ? argv[index + 1] : undefined

  return value ? normalizeEmail(value) : undefined
}

/** Accepts a plain email address and stores it in lowercase. */
function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new Error('--email must be an email address.')
  }

  return email
}

interface AlpacaEnvKeys {
  environment: 'live' | 'paper'
  keyId: string
  secret: string
}

/** Reads the previous Alpaca env keys when all three values are present. */
function readAlpacaEnv(): AlpacaEnvKeys | undefined {
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous Alpaca key, removed after migration
  const keyId = process.env.ALPACA_API_KEY_ID
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous Alpaca secret, removed after migration
  const secret = process.env.ALPACA_API_SECRET_KEY
  // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous Alpaca environment, removed after migration
  const environment = process.env.ALPACA_ENVIRONMENT
  const present = [keyId, secret, environment].filter(Boolean)

  if (present.length === 0) {
    return undefined
  }

  if (
    !keyId ||
    !secret ||
    (environment !== 'paper' && environment !== 'live')
  ) {
    throw new Error(
      'Set ALPACA_API_KEY_ID, ALPACA_API_SECRET_KEY, and ALPACA_ENVIRONMENT together, or omit all three.'
    )
  }

  return { environment, keyId, secret }
}

interface DepositAddressEnv {
  address: string
  asset: 'USDC' | 'USDT'
  chain: 'ethereum' | 'solana'
}

/** Reads the previous deploy-wide deposit addresses that are set. */
function readDepositAddressEnv(): DepositAddressEnv[] {
  const entries: Array<DepositAddressEnv & { value: string | undefined }> = [
    {
      address: '',
      asset: 'USDC',
      chain: 'ethereum',
      // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous deposit address, removed after migration
      value: process.env.ADDRESS_ETHEREUM_USDC,
    },
    {
      address: '',
      asset: 'USDT',
      chain: 'ethereum',
      // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous deposit address, removed after migration
      value: process.env.ADDRESS_ETHEREUM_USDT,
    },
    {
      address: '',
      asset: 'USDC',
      chain: 'solana',
      // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous deposit address, removed after migration
      value: process.env.ADDRESS_SOLANA_USDC,
    },
    {
      address: '',
      asset: 'USDT',
      chain: 'solana',
      // biome-ignore lint/suspicious/noUndeclaredEnvVars: previous deposit address, removed after migration
      value: process.env.ADDRESS_SOLANA_USDT,
    },
  ]

  return entries.flatMap(({ asset, chain, value }) => {
    const address = value?.trim()

    if (!address) {
      return []
    }

    if (!isValidDepositAddress(chain, address)) {
      throw new Error(
        `ADDRESS_${chain.toUpperCase()}_${asset} is not a valid ${chain} address.`
      )
    }

    return [{ address, asset, chain }]
  })
}

/** True when the value is a bcrypt hash the owner can actually sign in with. */
function isUsableBcryptHash(value: string | undefined): value is string {
  const match = value?.match(BCRYPT_HASH)

  if (!match) {
    return false
  }

  return Number(match[1]) >= 10
}
