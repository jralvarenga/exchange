'use client'

import { useState } from 'react'

import { DepositQr } from '@/components/account/deposit-qr'
import { PillGroup } from '@/components/pill-group'
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

/** Picks a saved network and stablecoin, then shows where to send funds. */
export function DepositPicker({ methods }: Props) {
  const chainOptions = getDepositChainOptions(methods)
  const [pickedChain, setChain] = useState<DepositChain>()
  const [pickedAsset, setAsset] = useState<DepositAsset>()
  // Saving or removing an address can drop the picked option, so fall back
  // to the first one still saved.
  const chain =
    chainOptions.find((option) => option.value === pickedChain)?.value ??
    chainOptions[0]?.value ??
    'ethereum'
  const assets = getDepositAssets({ chain, methods })
  const asset =
    assets.find((option) => option === pickedAsset) ?? assets[0] ?? 'USDC'
  const method = getDepositMethod({ asset, chain, methods })

  return (
    <div className="flex flex-col gap-6">
      <div className="-ml-3 flex flex-wrap gap-x-6 gap-y-2">
        <PillGroup
          label="Network"
          onChange={setChain}
          options={chainOptions}
          value={chain}
        />
        <PillGroup
          label="Stablecoin"
          onChange={setAsset}
          options={assets.map((option) => ({ label: option, value: option }))}
          value={asset}
        />
      </div>
      {method ? (
        <DepositQr key={`${method.chain}:${method.asset}`} method={method} />
      ) : null}
    </div>
  )
}
