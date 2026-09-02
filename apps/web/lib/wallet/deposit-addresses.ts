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

interface DepositEnvBinding {
  asset: DepositAsset
  chain: DepositChain
  chainLabel: string
  envName: keyof NodeJS.ProcessEnv
  tokenStandard: string
}

const depositEnvBindings: DepositEnvBinding[] = [
  {
    asset: 'USDC',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    envName: 'ADDRESS_ETHEREUM_USDC',
    tokenStandard: 'ERC-20',
  },
  {
    asset: 'USDT',
    chain: 'ethereum',
    chainLabel: 'Ethereum',
    envName: 'ADDRESS_ETHEREUM_USDT',
    tokenStandard: 'ERC-20',
  },
  {
    asset: 'USDC',
    chain: 'solana',
    chainLabel: 'Solana',
    envName: 'ADDRESS_SOLANA_USDC',
    tokenStandard: 'Solana',
  },
  {
    asset: 'USDT',
    chain: 'solana',
    chainLabel: 'Solana',
    envName: 'ADDRESS_SOLANA_USDT',
    tokenStandard: 'Solana',
  },
]

/** Reads configured deposit wallets from the environment, skipping empty values. */
export function getConfiguredDepositMethods(): DepositMethod[] {
  return depositEnvBindings.flatMap((binding) => {
    const address = readDepositAddress(process.env[binding.envName])

    if (!address) {
      return []
    }

    return [
      {
        address,
        asset: binding.asset,
        chain: binding.chain,
        chainLabel: binding.chainLabel,
        tokenStandard: binding.tokenStandard,
      },
    ]
  })
}

/** Returns the deposit method for a chain and asset when that env var is set. */
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

/** Returns a trimmed address, or undefined when the env value is missing. */
function readDepositAddress(value: string | undefined): string | undefined {
  const address = value?.trim()

  return address ? address : undefined
}
