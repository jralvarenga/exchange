import 'server-only'

import {
  deleteCryptoWallet,
  listCryptoWallets,
  upsertCryptoWallet,
} from '@workspace/db/queries/crypto-wallets'
import { z } from 'zod'

import {
  type DepositMethod,
  depositAddressInputSchema,
  depositAssets,
  depositChains,
  toDepositMethods,
} from '@/lib/wallet/deposit-addresses'

const userIdSchema = z.string().trim().min(1)

const saveDepositAddressInputSchema = depositAddressInputSchema.and(
  z.object({ userId: userIdSchema })
)

const removeDepositAddressInputSchema = z.object({
  asset: z.enum(depositAssets),
  chain: z.enum(depositChains),
  userId: userIdSchema,
})

type SaveDepositAddressInput = z.input<typeof saveDepositAddressInputSchema>
type RemoveDepositAddressInput = z.infer<typeof removeDepositAddressInputSchema>

/** Returns the signed-in user's saved deposit addresses as deposit methods. */
export async function listDepositMethods(
  userId: string
): Promise<DepositMethod[]> {
  return toDepositMethods(await listCryptoWallets(userIdSchema.parse(userId)))
}

/** Validates the address format for its network and stores it for this user. */
export async function saveDepositAddress(
  input: SaveDepositAddressInput
): Promise<void> {
  const parsed = saveDepositAddressInputSchema.parse(input)

  await upsertCryptoWallet({
    address: parsed.address,
    asset: parsed.asset,
    chain: parsed.chain,
    id: crypto.randomUUID(),
    userId: parsed.userId,
  })
}

/** Removes one of the signed-in user's deposit addresses. */
export async function removeDepositAddress(
  input: RemoveDepositAddressInput
): Promise<void> {
  await deleteCryptoWallet(removeDepositAddressInputSchema.parse(input))
}
