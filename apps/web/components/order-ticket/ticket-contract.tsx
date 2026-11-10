'use client'

import { useEffect, useEffectEvent, useState } from 'react'

import { TicketContractStatus } from '@/components/order-ticket/ticket-contract-status'
import { TicketPills } from '@/components/order-ticket/ticket-pills'
import { TicketSelect } from '@/components/order-ticket/ticket-select'
import { useOptionChain } from '@/hooks/use-option-chain'
import type { OptionContract } from '@/lib/alpaca/market-schemas'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import {
  resolveListedExpiration,
  toOptionTicketAsset,
} from '@/lib/order-ticket/draft'
import { formatTicketMoney } from '@/lib/order-ticket/pricing'
import type { TicketAsset } from '@/models/order-ticket/ticket'

interface Props {
  contract: TicketAsset | null
  onClear: () => void
  onSelect: (asset: TicketAsset) => void
  underlying: AssetSearchResult
}

/** Lets a stock order become a specific call or put on that stock. */
export function TicketContract({
  contract,
  onClear,
  onSelect,
  underlying,
}: Props) {
  const [expiration, setExpiration] = useState(contract?.expirationDate)
  const [right, setRight] = useState<'call' | 'put'>(
    contract?.optionType ?? 'call'
  )
  const [seenSymbol, setSeenSymbol] = useState(contract?.symbol)
  const [seenUnderlying, setSeenUnderlying] = useState(underlying.symbol)
  const clearContract = useEffectEvent(onClear)
  if (seenUnderlying !== underlying.symbol) {
    setSeenUnderlying(underlying.symbol)
    setSeenSymbol(contract?.symbol)
    setExpiration(contract?.expirationDate)
    setRight(contract?.optionType ?? 'call')
  } else if (contract?.symbol !== seenSymbol) {
    setSeenSymbol(contract?.symbol)
    if (contract?.optionType) setRight(contract.optionType)
    if (contract?.expirationDate) setExpiration(contract.expirationDate)
  }
  const chain = useOptionChain({
    enabled: true,
    expiration,
    underlying: underlying.symbol,
  })
  const sameUnderlying =
    chain.data?.underlying.toLowerCase() === underlying.symbol.toLowerCase()
  const listedExpiration =
    sameUnderlying && chain.data
      ? resolveListedExpiration({
          expiration,
          expirations: chain.data.expirations,
          returnedExpiration: chain.data.expirationDate,
        })
      : ''
  if (
    sameUnderlying &&
    chain.data &&
    expiration &&
    listedExpiration &&
    expiration !== listedExpiration
  ) {
    setExpiration(listedExpiration)
  }
  const expirationList = chain.data?.expirations.join(',') ?? ''
  useEffect(() => {
    if (!sameUnderlying || !expirationList || !contract?.expirationDate) return
    if (expirationList.split(',').includes(contract.expirationDate)) return
    clearContract()
  }, [sameUnderlying, expirationList, contract?.expirationDate])
  if (!sameUnderlying) {
    return <TicketContractStatus status={chain.isError ? 'error' : 'loading'} />
  }
  if (!chain.data || chain.data.expirations.length === 0) {
    return <TicketContractStatus status="none" />
  }
  const activeExpiration = listedExpiration
  const contracts = (
    right === 'call' ? chain.data.calls : chain.data.puts
  ).filter((item) => item.tradable)
  const selected = contracts.some((item) => item.symbol === contract?.symbol)
    ? (contract?.symbol ?? '')
    : ''
  const strikeReady = chain.data.expirationDate === activeExpiration

  /** Replaces the order's asset with the chosen contract, or returns to the stock. */
  function selectContract(symbol: string): void {
    if (!symbol) {
      onClear()
      return
    }
    const chosen = contracts.find((item) => item.symbol === symbol)
    if (chosen) onSelect(toOptionTicketAsset({ contract: chosen, underlying }))
  }

  return (
    <div className="flex flex-col gap-4">
      <TicketSelect
        label="Expiration"
        name="expiration"
        onChange={(next) => {
          setExpiration(next)
          if (contract?.expirationDate && contract.expirationDate !== next)
            onClear()
        }}
        options={chain.data.expirations.map((value) => ({
          label: formatExpiration(value),
          value,
        }))}
        value={activeExpiration}
      />
      <TicketPills
        label="Contract type"
        onChange={(next) => {
          setRight(next)
          if (contract?.optionType && contract.optionType !== next) onClear()
        }}
        options={[
          { label: 'Call', value: 'call' },
          { label: 'Put', value: 'put' },
        ]}
        value={right}
      />
      {strikeReady ? (
        contracts.length > 0 ? (
          <TicketSelect
            label="Strike"
            name="strike"
            onChange={(symbol) => selectContract(symbol)}
            options={[
              { label: 'Choose a strike', value: '' },
              ...contracts.map((item) => ({
                label: formatStrikeChoice(item),
                value: item.symbol,
              })),
            ]}
            value={selected}
          />
        ) : (
          <TicketContractStatus status="empty" />
        )
      ) : chain.isError ? (
        <TicketContractStatus status="error" />
      ) : (
        <TicketContractStatus status="loading" />
      )}
    </div>
  )
}

/** Formats an expiration date without shifting it across time zones. */
function formatExpiration(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`))
}

/** Shows a strike beside the chain's bid and ask. */
function formatStrikeChoice(contract: OptionContract): string {
  const strike = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(contract.strike)
  return `${strike} · Bid ${formatTicketMoney(contract.bidPrice)} · Ask ${formatTicketMoney(contract.askPrice)}`
}
