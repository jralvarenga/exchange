'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { CircleAlert } from 'lucide-react'
import { useState } from 'react'

import { DepositAddress } from '@/components/wallet/deposit-address'
import {
  type DepositAsset,
  type DepositChain,
  type DepositMethod,
  getDepositAssets,
  getDepositChainOptions,
  getDepositMethod,
} from '@/lib/wallet/deposit-addresses'

interface Props {
  methods: DepositMethod[]
}

/** Renders deposit options for every chain and asset that has an env address. */
export function FundsWalletCard({ methods }: Props) {
  const chainOptions = getDepositChainOptions(methods)
  const [chain, setChain] = useState<DepositChain>(
    () => chainOptions[0]?.value ?? 'ethereum'
  )
  const [asset, setAsset] = useState<DepositAsset>(() => {
    const initialChain = chainOptions[0]?.value ?? 'ethereum'

    return getDepositAssets({ chain: initialChain, methods })[0] ?? 'USDC'
  })
  const assets = getDepositAssets({ chain, methods })
  const method = getDepositMethod({ asset, chain, methods })

  /** Updates the network and keeps an asset that exists on that network. */
  function handleChainChange(nextChain: DepositChain): void {
    setChain(nextChain)

    const nextAssets = getDepositAssets({ chain: nextChain, methods })

    if (!nextAssets.includes(asset)) {
      const nextAsset = nextAssets[0]

      if (nextAsset) {
        setAsset(nextAsset)
      }
    }
  }

  return (
    <Card className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>Deposit</CardTitle>
        <CardDescription>
          Pick a network and a stablecoin, then copy the address into your
          sending wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-8">
          {chainOptions.length > 0 ? (
            <fieldset className="flex min-w-0 flex-col gap-2">
              <legend className="px-1 font-bold">Network</legend>
              <div className="flex rounded-full bg-muted p-1">
                {chainOptions.map((option) => (
                  <Button
                    aria-pressed={chain === option.value}
                    className="h-11 rounded-full px-5"
                    key={option.value}
                    onClick={() => handleChainChange(option.value)}
                    type="button"
                    variant={chain === option.value ? 'default' : 'ghost'}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {assets.length > 0 ? (
            <fieldset className="flex min-w-0 flex-col gap-2">
              <legend className="px-1 font-medium">Asset</legend>
              <div className="flex rounded-full bg-muted p-1">
                {assets.map((option) => (
                  <Button
                    aria-pressed={asset === option}
                    className="h-11 rounded-full px-5"
                    key={option}
                    onClick={() => setAsset(option)}
                    type="button"
                    variant={asset === option ? 'default' : 'ghost'}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>

        {method ? (
          <DepositAddress
            key={`${method.chain}:${method.asset}`}
            method={method}
          />
        ) : (
          <p className="font-medium text-muted-foreground">
            No deposit address for this network and asset.
          </p>
        )}

        {method ? (
          <p className="flex shrink-0 gap-3 text-muted-foreground text-sm">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning"
            />
            <span>
              Send only {method.asset} on {method.chainLabel} (
              {method.tokenStandard}). Other networks or tokens may not be
              credited.
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
