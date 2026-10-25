'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  AlpacaCredentialsError,
  type MaskedAlpacaCredential,
  removeCredential,
  saveCredential,
  setActiveAlpacaEnvironment,
  testCredential,
} from '@/lib/alpaca/credentials'
import { alpacaEnvironmentSchema } from '@/lib/alpaca/schemas'
import { requireSession } from '@/lib/auth/require-session'
import {
  removeDepositAddress,
  saveDepositAddress,
} from '@/lib/wallet/crypto-wallets'
import {
  depositAddressInputSchema,
  depositAssets,
  depositChains,
} from '@/lib/wallet/deposit-addresses'

interface CredentialActionState {
  credential?: MaskedAlpacaCredential
  message?: string
}

interface DepositAddressActionState {
  message?: string
  saved?: boolean
}

const depositSlotSchema = z.object({
  asset: z.enum(depositAssets),
  chain: z.enum(depositChains),
})

const saveInputSchema = z.object({
  environment: alpacaEnvironmentSchema,
  keyId: z.string().trim().min(8).max(128),
  secret: z.string().trim().min(8).max(256),
})

/** Saves a tested Alpaca key pair and returns only the masked record. */
export async function saveAlpacaCredentialAction(
  _state: CredentialActionState,
  formData: FormData
): Promise<CredentialActionState> {
  const session = await requireSession()
  const parsed = saveInputSchema.safeParse({
    environment: formData.get('environment'),
    keyId: formData.get('keyId'),
    secret: formData.get('secret'),
  })

  if (!parsed.success) {
    return { message: 'Enter the Alpaca key ID and secret.' }
  }

  try {
    const credential = await saveCredential({
      ...parsed.data,
      userId: session.user.id,
    })
    revalidatePath('/', 'layout')

    return { credential }
  } catch (error) {
    if (error instanceof AlpacaCredentialsError) {
      return {
        message:
          'Alpaca rejected those keys. Check the environment and try again.',
      }
    }

    return { message: 'Those keys could not be saved.' }
  }
}

/** Calls Alpaca with the stored keys and returns the masked result. */
export async function testAlpacaCredentialAction(
  environment: 'live' | 'paper'
): Promise<CredentialActionState> {
  const session = await requireSession()
  const parsed = alpacaEnvironmentSchema.safeParse(environment)

  if (!parsed.success) {
    return { message: 'The keys could not be tested.' }
  }

  try {
    const credential = await testCredential({
      environment: parsed.data,
      userId: session.user.id,
    })
    revalidatePath('/', 'layout')

    return { credential }
  } catch (error) {
    if (error instanceof AlpacaCredentialsError) {
      return { message: 'Alpaca rejected the stored keys.' }
    }

    return { message: 'The keys could not be tested.' }
  }
}

/** Deletes one environment's stored keys for the signed-in user. */
export async function removeAlpacaCredentialAction(
  environment: 'live' | 'paper'
): Promise<CredentialActionState> {
  const session = await requireSession()
  const parsed = alpacaEnvironmentSchema.safeParse(environment)

  if (!parsed.success) {
    return { message: 'Those keys could not be removed.' }
  }

  try {
    await removeCredential({
      environment: parsed.data,
      userId: session.user.id,
    })
    revalidatePath('/', 'layout')

    return {}
  } catch {
    return { message: 'Those keys could not be removed.' }
  }
}

/** Switches the account used for Alpaca calls when that environment is valid. */
export async function setActiveAlpacaEnvironmentAction(
  environment: 'live' | 'paper'
): Promise<CredentialActionState> {
  const session = await requireSession()
  const parsed = alpacaEnvironmentSchema.safeParse(environment)

  if (!parsed.success) {
    return { message: 'The active account could not be changed.' }
  }

  try {
    await setActiveAlpacaEnvironment({
      environment: parsed.data,
      userId: session.user.id,
    })
    revalidatePath('/', 'layout')

    return {}
  } catch (error) {
    if (error instanceof AlpacaCredentialsError) {
      return { message: 'Add a valid key before switching to that account.' }
    }

    return { message: 'The active account could not be changed.' }
  }
}

/** Saves the signed-in user's deposit address for one network and stablecoin. */
export async function saveDepositAddressAction(
  _state: DepositAddressActionState,
  formData: FormData
): Promise<DepositAddressActionState> {
  const session = await requireSession()
  const parsed = depositAddressInputSchema.safeParse({
    address: formData.get('address'),
    asset: formData.get('asset'),
    chain: formData.get('chain'),
  })

  if (!parsed.success) {
    return { message: 'Enter a valid address for this network.' }
  }

  try {
    await saveDepositAddress({ ...parsed.data, userId: session.user.id })
    revalidatePath('/', 'layout')

    return { saved: true }
  } catch {
    return { message: 'That address could not be saved.' }
  }
}

/** Removes the signed-in user's deposit address for one network and stablecoin. */
export async function removeDepositAddressAction(slot: {
  asset: string
  chain: string
}): Promise<DepositAddressActionState> {
  const session = await requireSession()
  const parsed = depositSlotSchema.safeParse(slot)

  if (!parsed.success) {
    return { message: 'That address could not be removed.' }
  }

  try {
    await removeDepositAddress({ ...parsed.data, userId: session.user.id })
    revalidatePath('/', 'layout')

    return {}
  } catch {
    return { message: 'That address could not be removed.' }
  }
}
