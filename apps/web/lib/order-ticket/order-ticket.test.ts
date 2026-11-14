import { describe, expect, test } from 'bun:test'

import type { OptionContract } from '@/lib/alpaca/market-schemas'
import { createOrderRequestSchema } from '@/lib/alpaca/schemas'
import {
  canUseDollars,
  createTicketDraft,
  getTicketOrderTypes,
  getTicketUnderlying,
  isChoosingTicketContract,
  isTicketOptionMode,
  openTicketDraft,
  reconcileTicket,
  resolveListedExpiration,
  selectTicketAsset,
  toOptionTicketAsset,
  withPageAsset,
} from '@/lib/order-ticket/draft'
import { getTicketErrorField } from '@/lib/order-ticket/focus'
import {
  convertTicketAmount,
  estimateTicketValue,
} from '@/lib/order-ticket/pricing'
import {
  buildTicketRequest,
  isSameTicketSubmission,
} from '@/lib/order-ticket/request'
import type { TicketAsset, TicketDraft } from '@/models/order-ticket/ticket'

const stock: TicketAsset = {
  assetClass: 'us_equity',
  exchange: 'NASDAQ',
  fractionable: true,
  id: 'aapl',
  name: 'Apple Inc.',
  symbol: 'AAPL',
}
const crypto: TicketAsset = {
  ...stock,
  assetClass: 'crypto',
  symbol: 'BTC/USD',
  id: 'btc',
}
const option: TicketAsset = {
  ...stock,
  assetClass: 'us_option',
  fractionable: false,
  symbol: 'AAPL261218C00200000',
  id: 'contract',
}

/** Creates a complete sample entry for testing the public request contract. */
function makeDraft(patch: Partial<TicketDraft> = {}): TicketDraft {
  return {
    ...createTicketDraft(),
    asset: stock,
    amount: '10',
    limitPrice: '200',
    stopPrice: '190',
    trail: '2',
    takeProfitLimitPrice: '220',
    stopLossStopPrice: '180',
    ...patch,
  }
}

/** Checks that the ticket can submit its payload through the real API schema. */
function expectAccepted(draft: TicketDraft): void {
  const result = createOrderRequestSchema.safeParse(buildTicketRequest(draft))
  expect(result.success ? [] : result.error.issues).toEqual([])
}

describe('order ticket request contract', () => {
  for (const type of [
    'market',
    'limit',
    'stop',
    'stop_limit',
    'trailing_stop',
  ] as const) {
    for (const side of ['buy', 'sell'] as const) {
      test(`${side} stock ${type}`, () =>
        expectAccepted(makeDraft({ type, side })))
    }
  }
  test('dollar and percent trailing stops are exclusive', () => {
    const dollars = buildTicketRequest(
      makeDraft({ type: 'trailing_stop', trailMode: 'dollars' })
    )
    expect(dollars.trailPrice).toBe('2')
    expect(dollars.trailPercent).toBeUndefined()
    expectAccepted(makeDraft({ type: 'trailing_stop', trailMode: 'dollars' }))
    const percent = buildTicketRequest(makeDraft({ type: 'trailing_stop' }))
    expect(percent.trailPercent).toBe('2')
    expect(percent.trailPrice).toBeUndefined()
  })
  for (const orderClass of ['bracket', 'oco', 'oto'] as const) {
    for (const side of ['buy', 'sell'] as const) {
      test(`${side} ${orderClass} with both supported entry durations`, () => {
        for (const timeInForce of ['day', 'gtc'] as const) {
          const draft = reconcileTicket(
            makeDraft({ orderClass, side, timeInForce })
          )
          expectAccepted(draft)
          if (orderClass === 'oco')
            expect(buildTicketRequest(draft).limitPrice).toBe('220')
        }
      })
    }
  }
  test('OTO sends only the selected exit', () => {
    const takeProfit = buildTicketRequest(makeDraft({ orderClass: 'oto' }))
    expect(takeProfit.stopLossStopPrice).toBeUndefined()
    const stopLoss = makeDraft({ orderClass: 'oto', otoLeg: 'stop_loss' })
    expect(buildTicketRequest(stopLoss).takeProfitLimitPrice).toBeUndefined()
    expectAccepted(stopLoss)
  })
  for (const type of ['market', 'limit', 'stop_limit'] as const) {
    test(`crypto ${type}`, () =>
      expectAccepted(reconcileTicket(makeDraft({ asset: crypto, type }))))
  }
  test('notional stock and crypto orders', () => {
    expectAccepted(reconcileTicket(makeDraft({ quantityMode: 'notional' })))
    expectAccepted(
      reconcileTicket(makeDraft({ asset: crypto, quantityMode: 'notional' }))
    )
  })
  for (const type of ['market', 'limit', 'stop', 'stop_limit'] as const) {
    test(`single-leg option ${type} uses whole contracts and Day`, () => {
      const draft = reconcileTicket(
        makeDraft({ asset: option, timeInForce: 'gtc', type })
      )
      expect(draft.timeInForce).toBe('day')
      expectAccepted(draft)
      expect(buildTicketRequest(draft).positionIntent).toBe('buy_to_open')
    })
  }
  test('fractional options and nonfractionable stocks fail at the quantity', () => {
    for (const asset of [option, { ...stock, fractionable: false }]) {
      const result = createOrderRequestSchema.safeParse(
        buildTicketRequest(makeDraft({ asset, amount: '1.5' }))
      )
      expect(result.success).toBe(false)
      if (!result.success)
        expect(
          result.error.issues.some((issue) => issue.path[0] === 'amount')
        ).toBe(true)
    }
  })
  test('missing limit and linked exit values report field errors', () => {
    const result = createOrderRequestSchema.safeParse(
      buildTicketRequest(
        makeDraft({
          type: 'limit',
          orderClass: 'bracket',
          limitPrice: '',
          takeProfitLimitPrice: '',
          stopLossStopPrice: '',
        })
      )
    )
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          'limitPrice',
          'takeProfitLimitPrice',
          'stopLossStopPrice',
        ])
      )
  })
  test('extended hours cannot survive an incompatible strategy or type', () => {
    expectAccepted(
      reconcileTicket(makeDraft({ extendedHours: true, type: 'limit' }))
    )
    expect(
      reconcileTicket(makeDraft({ extendedHours: true })).extendedHours
    ).toBe(false)
    expect(
      reconcileTicket(
        makeDraft({ extendedHours: true, type: 'limit', orderClass: 'bracket' })
      ).extendedHours
    ).toBe(false)
  })
  test('normalization removes incompatible crypto and option controls', () => {
    const draft = reconcileTicket(
      makeDraft({
        asset: crypto,
        orderClass: 'bracket',
        type: 'trailing_stop',
        timeInForce: 'day',
      })
    )
    expect(draft.orderClass).toBe('simple')
    expect(draft.timeInForce).toBe('gtc')
    expect(draft.type).toBe('market')
    expect(getTicketOrderTypes(makeDraft({ orderClass: 'oto' }))).toEqual([
      'market',
      'limit',
    ])
    expect(canUseDollars(makeDraft({ asset: option }))).toBe(false)
    expect(
      canUseDollars(makeDraft({ asset: { ...stock, fractionable: false } }))
    ).toBe(false)
  })
  test('an invalid fractional size never silently removes linked exits', () => {
    const draft = reconcileTicket(
      makeDraft({ orderClass: 'bracket', amount: '1.5' })
    )
    expect(draft.orderClass).toBe('bracket')
    const result = createOrderRequestSchema.safeParse(buildTicketRequest(draft))
    expect(result.success).toBe(false)
  })
  test('hidden prices and exits never leak into simple market orders', () => {
    const request = buildTicketRequest(makeDraft())
    expect(request.limitPrice).toBeUndefined()
    expect(request.stopPrice).toBeUndefined()
    expect(request.takeProfitLimitPrice).toBeUndefined()
    expect(request.stopLossStopPrice).toBeUndefined()
    expect(request.positionIntent).toBeUndefined()
  })
  test('a different symbol resets prices, units, and strategy, preserving side', () => {
    const changed = selectTicketAsset({
      asset: crypto,
      draft: makeDraft({ type: 'limit', side: 'sell', orderClass: 'bracket' }),
    })
    expect(changed.asset).toBe(crypto)
    expect(changed.limitPrice).toBe('')
    expect(changed.orderClass).toBe('simple')
    expect(changed.side).toBe('sell')
    expect(changed.timeInForce).toBe('gtc')
  })
  test('estimates use entered limit prices and a 100-share contract multiplier', () => {
    expect(estimateTicketValue({ draft: makeDraft(), price: 205 })).toBe(2050)
    expect(
      estimateTicketValue({ draft: makeDraft({ type: 'limit' }), price: 205 })
    ).toBe(2000)
    expect(
      estimateTicketValue({
        draft: makeDraft({ asset: option, amount: '2' }),
        price: 3.5,
      })
    ).toBe(700)
    expect(
      estimateTicketValue({ draft: makeDraft({ amount: '' }), price: 205 })
    ).toBeUndefined()
    expect(estimateTicketValue({ draft: makeDraft() })).toBeUndefined()
  })
  test('limit estimates fall back to the quote until a limit price is entered', () => {
    expect(
      estimateTicketValue({
        draft: makeDraft({ type: 'limit', limitPrice: '' }),
        price: 205,
      })
    ).toBe(2050)
  })
  test('switching units converts the size at the reference price', () => {
    const shares = makeDraft({ amount: '10' })
    const dollars = reconcileTicket({ ...shares, quantityMode: 'notional' })
    expect(
      convertTicketAmount({ draft: shares, next: dollars, price: 225.48 })
    ).toBe('2254.8')
    const back = reconcileTicket({
      ...dollars,
      amount: '500',
      type: 'limit',
      limitPrice: '',
    })
    expect(back.quantityMode).toBe('qty')
    expect(
      convertTicketAmount({
        draft: { ...dollars, amount: '500' },
        next: back,
        price: 200,
      })
    ).toBe('2.5')
    expect(
      convertTicketAmount({
        draft: { ...dollars, amount: '500' },
        next: { ...back, asset: { ...stock, fractionable: false } },
        price: 200,
      })
    ).toBe('2')
    expect(convertTicketAmount({ draft: shares, next: dollars })).toBe('')
  })
  test('dollars convert to crypto units with up to 9 decimals', () => {
    const dollars = reconcileTicket(
      makeDraft({ asset: crypto, amount: '5', quantityMode: 'notional' })
    )
    const units = { ...dollars, quantityMode: 'qty' as const }
    expect(
      convertTicketAmount({ draft: dollars, next: units, price: 100_000 })
    ).toBe('0.00005')
    const tiny = reconcileTicket(
      makeDraft({ asset: crypto, amount: '0.05', quantityMode: 'notional' })
    )
    expect(
      convertTicketAmount({
        draft: tiny,
        next: { ...tiny, quantityMode: 'qty' },
        price: 100_000,
      })
    ).toBe('0.0000005')
    const repeating = reconcileTicket(
      makeDraft({ asset: crypto, amount: '1', quantityMode: 'notional' })
    )
    expect(
      convertTicketAmount({
        draft: repeating,
        next: { ...repeating, quantityMode: 'qty' },
        price: 3,
      })
    ).toBe('0.333333333')
  })
  test('reopening the same symbol keeps the draft and its order', () => {
    const current = makeDraft({ amount: '4', limitPrice: '12', type: 'limit' })
    const opened = openTicketDraft({
      current,
      options: { assetIdentifier: 'AAPL', side: 'buy' },
    })
    expect(opened.needsLookup).toBe(false)
    expect(opened.draft).toBe(current)
    expect(isSameTicketSubmission({ current, next: opened.draft })).toBe(true)
    const changed = openTicketDraft({
      current,
      options: { assetIdentifier: 'MSFT' },
    })
    expect(changed.needsLookup).toBe(true)
    expect(changed.draft.asset).toBeNull()
    expect(isSameTicketSubmission({ current, next: changed.draft })).toBe(false)
  })
  test('an open request without an asset takes the page asset', () => {
    const empty = createTicketDraft()
    const opened = openTicketDraft({
      current: empty,
      options: withPageAsset({
        current: empty,
        options: { side: 'sell' },
        pageAsset: crypto,
      }),
    })
    expect(opened.needsLookup).toBe(false)
    expect(opened.draft.asset).toBe(crypto)
    expect(opened.draft.side).toBe('sell')
    const other = makeDraft({ asset: { ...stock, id: 'msft', symbol: 'MSFT' } })
    expect(
      withPageAsset({ current: other, options: {}, pageAsset: stock }).asset
    ).toBe(stock)
    expect(
      withPageAsset({
        current: other,
        options: { assetIdentifier: 'TSLA' },
        pageAsset: stock,
      })
    ).toEqual({ assetIdentifier: 'TSLA' })
    expect(
      withPageAsset({ current: other, options: {}, pageAsset: null })
    ).toEqual({})
  })
  test('the page asset keeps a draft already trading it or its options', () => {
    const current = makeDraft({ amount: '4', limitPrice: '12', type: 'limit' })
    const options = withPageAsset({ current, options: {}, pageAsset: stock })
    expect(options).toEqual({})
    expect(openTicketDraft({ current, options }).draft).toBe(current)
    const contract = makeDraft({
      asset: { ...option, underlying: { ...stock, assetClass: 'us_equity' } },
    })
    expect(
      withPageAsset({ current: contract, options: {}, pageAsset: stock })
    ).toEqual({})
  })
  test('option-picking lives on the draft and clears when the asset changes', () => {
    const picking = makeDraft({ preferOption: true })
    expect(isTicketOptionMode(picking)).toBe(true)
    expect(isChoosingTicketContract(picking)).toBe(true)
    expect(isChoosingTicketContract(makeDraft({ asset: option }))).toBe(false)
    expect(isTicketOptionMode(makeDraft({ asset: option }))).toBe(true)
    expect(isChoosingTicketContract(makeDraft())).toBe(false)
    const changed = selectTicketAsset({
      asset: { ...stock, id: 'msft', symbol: 'MSFT' },
      draft: picking,
    })
    expect(changed.preferOption).toBe(false)
    expect(isChoosingTicketContract(changed)).toBe(false)
    const same = selectTicketAsset({ asset: stock, draft: picking })
    expect(same.preferOption).toBe(true)
    const reopened = openTicketDraft({
      current: picking,
      options: { assetIdentifier: 'AAPL' },
    })
    expect(reopened.draft.preferOption).toBe(true)
  })
  test('an unavailable expiration falls back to the listed date', () => {
    expect(
      resolveListedExpiration({
        expiration: '2020-01-17',
        expirations: ['2027-01-15', '2027-06-18'],
        returnedExpiration: '2027-01-15',
      })
    ).toBe('2027-01-15')
    expect(
      resolveListedExpiration({
        expiration: '2027-06-18',
        expirations: ['2027-01-15', '2027-06-18'],
        returnedExpiration: '2027-01-15',
      })
    ).toBe('2027-06-18')
    expect(
      resolveListedExpiration({
        expirations: ['2027-01-15', '2027-06-18'],
      })
    ).toBe('2027-01-15')
  })
  test('an option contract keeps the stock it is written on', () => {
    const contract: OptionContract = {
      expirationDate: '2026-12-18',
      strike: 200,
      symbol: 'AAPL1261218C00200000',
      tradable: true,
      type: 'call',
    }
    const asset = toOptionTicketAsset({
      contract,
      underlying: {
        assetClass: 'us_equity',
        exchange: stock.exchange,
        fractionable: stock.fractionable,
        id: stock.id,
        name: stock.name,
        symbol: stock.symbol,
      },
    })
    expect(asset.assetClass).toBe('us_option')
    expect(asset.symbol).toBe('AAPL1261218C00200000')
    expect(asset.name).toBe('AAPL Dec 18, 2026 200 call')
    expect(asset.expirationDate).toBe('2026-12-18')
    expect(getTicketUnderlying(asset)?.symbol).toBe('AAPL')
    expect(getTicketUnderlying(stock)?.symbol).toBe('AAPL')
  })
  test('switching away from a priced type drops its hidden prices', () => {
    const market = reconcileTicket(
      makeDraft({ type: 'market', limitPrice: '50', stopPrice: '40' })
    )
    expect(market.limitPrice).toBe('')
    expect(market.stopPrice).toBe('')
    const limit = reconcileTicket(
      makeDraft({ type: 'limit', limitPrice: '50' })
    )
    expect(limit.limitPrice).toBe('50')
  })
  test('OCO limit price errors point at the take-profit field', () => {
    expect(
      getTicketErrorField({ field: 'limitPrice', orderClass: 'oco' })
    ).toBe('takeProfitLimitPrice')
    expect(
      getTicketErrorField({ field: 'limitPrice', orderClass: 'simple' })
    ).toBe('limitPrice')
    expect(
      getTicketErrorField({ field: 'trailPrice', orderClass: 'simple' })
    ).toBe('trailPercent')
  })
})
