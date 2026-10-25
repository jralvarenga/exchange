import { describe, expect, test } from 'bun:test'

import {
  depositAddressInputSchema,
  toDepositMethods,
} from './deposit-addresses'

const ethereumAddress = '0x42a76C83014e886e639768D84EAF3573b1876844'
const solanaAddress = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

describe('deposit address validation', () => {
  test('accepts an Ethereum address and trims it', () => {
    const result = depositAddressInputSchema.safeParse({
      address: `  ${ethereumAddress} `,
      asset: 'USDC',
      chain: 'ethereum',
    })

    expect(result.success).toBe(true)
    expect(result.data?.address).toBe(ethereumAddress)
  })

  test('accepts a Solana address', () => {
    expect(
      depositAddressInputSchema.safeParse({
        address: solanaAddress,
        asset: 'USDT',
        chain: 'solana',
      }).success
    ).toBe(true)
  })

  test('rejects an address for the wrong network', () => {
    expect(
      depositAddressInputSchema.safeParse({
        address: ethereumAddress,
        asset: 'USDC',
        chain: 'solana',
      }).success
    ).toBe(false)
    expect(
      depositAddressInputSchema.safeParse({
        address: solanaAddress,
        asset: 'USDC',
        chain: 'ethereum',
      }).success
    ).toBe(false)
  })

  test('rejects unsupported assets and chains', () => {
    expect(
      depositAddressInputSchema.safeParse({
        address: ethereumAddress,
        asset: 'DAI',
        chain: 'ethereum',
      }).success
    ).toBe(false)
    expect(
      depositAddressInputSchema.safeParse({
        address: ethereumAddress,
        asset: 'USDC',
        chain: 'bitcoin',
      }).success
    ).toBe(false)
  })
})

describe('toDepositMethods', () => {
  test('maps stored rows to methods in slot order and skips unknown pairs', () => {
    const methods = toDepositMethods([
      { address: solanaAddress, asset: 'USDT', chain: 'solana' },
      { address: ethereumAddress, asset: 'USDC', chain: 'ethereum' },
      { address: ethereumAddress, asset: 'DAI', chain: 'ethereum' },
    ])

    expect(methods.map((method) => `${method.chain}:${method.asset}`)).toEqual([
      'ethereum:USDC',
      'solana:USDT',
    ])
    expect(methods[0]?.tokenStandard).toBe('ERC-20')
  })
})
