import { z } from 'zod'

export const depositChains = ['ethereum', 'solana'] as const
export const depositAssets = ['USDC', 'USDT'] as const

export type DepositChain = (typeof depositChains)[number]
export type DepositAsset = (typeof depositAssets)[number]

export interface DepositMethod {
  address: string
  asset: DepositAsset
  chain: DepositChain
  chainLabel: string
  tokenStandard: string
}

export interface DepositChainOption {
  label: string
  value: DepositChain
}

interface GetDepositMethodOptions {
  asset: DepositAsset
  chain: DepositChain
  methods: DepositMethod[]
}

interface GetDepositAssetsOptions {
  chain: DepositChain
  methods: DepositMethod[]
}

export interface DepositSlot {
  asset: DepositAsset
  chain: DepositChain
  chainLabel: string
  tokenStandard: string
}

interface StoredDepositAddress {
  address: string
  asset: string
  chain: string
}

/** Every network and stablecoin pair a user can add a deposit address for. */
export const depositSlots: DepositSlot[] = [
  {
    asset: 'USDC',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    tokenStandard: 'ERC-20',
  },
  {
    asset: 'USDT',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    tokenStandard: 'ERC-20',
  },
  {
    asset: 'USDC',
    chain: 'solana',
    chainLabel: 'Solana',
    tokenStandard: 'Solana',
  },
  {
    asset: 'USDT',
    chain: 'solana',
    chainLabel: 'Solana',
    tokenStandard: 'Solana',
  },
]

const depositAddressPatterns: Record<DepositChain, RegExp> = {
  ethereum: /^0x[0-9a-fA-F]{40}$/u,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/u,
}

/** Validates one deposit address submission against its network's format. */
export const depositAddressInputSchema = z
  .object({
    address: z.string().trim(),
    asset: z.enum(depositAssets),
    chain: z.enum(depositChains),
  })
  .refine((input) => depositAddressPatterns[input.chain].test(input.address), {
    message: 'Enter a valid address for this network.',
    path: ['address'],
  })

/** Maps stored addresses onto deposit methods in the fixed slot order. */
export function toDepositMethods(
  addresses: StoredDepositAddress[]
): DepositMethod[] {
  return depositSlots.flatMap((slot) => {
    const stored = addresses.find(
      (address) => address.chain === slot.chain && address.asset === slot.asset
    )

    return stored ? [{ ...slot, address: stored.address }] : []
  })
}

/** Returns the deposit method for a chain and asset when the user saved one. */
export function getDepositMethod(
  options: GetDepositMethodOptions
): DepositMethod | undefined {
  return options.methods.find(
    (method) => method.asset === options.asset && method.chain === options.chain
  )
}

/** Returns networks that have at least one configured deposit address. */
export function getDepositChainOptions(
  methods: DepositMethod[]
): DepositChainOption[] {
  const seen = new Set<DepositChain>()

  return methods.flatMap((method) => {
    if (seen.has(method.chain)) {
      return []
    }

    seen.add(method.chain)

    return [{ label: method.chainLabel, value: method.chain }]
  })
}

/** Returns assets that have a deposit address on the selected network. */
export function getDepositAssets(
  options: GetDepositAssetsOptions
): DepositAsset[] {
  return options.methods.flatMap((method) =>
    method.chain === options.chain ? [method.asset] : []
  )
}
