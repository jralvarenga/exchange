import { and, eq } from 'drizzle-orm'

import { db } from '../client'
import { cryptoWallets } from '../schema/crypto-wallets'

export type CryptoWalletRow = typeof cryptoWallets.$inferSelect

interface CryptoWalletIdentity {
  asset: string
  chain: string
  userId: string
}

interface UpsertCryptoWalletInput extends CryptoWalletIdentity {
  address: string
  id: string
}

/** Inserts or replaces one user's deposit address for a network and asset. */
export async function upsertCryptoWallet(
  input: UpsertCryptoWalletInput
): Promise<void> {
  const now = new Date()

  await db
    .insert(cryptoWallets)
    .values({
      address: input.address,
      asset: input.asset,
      chain: input.chain,
      createdAt: now,
      id: input.id,
      updatedAt: now,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        address: input.address,
        updatedAt: now,
      },
      target: [cryptoWallets.userId, cryptoWallets.chain, cryptoWallets.asset],
    })
}

/** Lists the deposit addresses owned by one user. */
export async function listCryptoWallets(
  userId: string
): Promise<CryptoWalletRow[]> {
  return db.select().from(cryptoWallets).where(eq(cryptoWallets.userId, userId))
}

/** Deletes one user's deposit address for a network and asset. */
export async function deleteCryptoWallet(
  input: CryptoWalletIdentity
): Promise<void> {
  await db
    .delete(cryptoWallets)
    .where(
      and(
        eq(cryptoWallets.userId, input.userId),
        eq(cryptoWallets.chain, input.chain),
        eq(cryptoWallets.asset, input.asset)
      )
    )
}
