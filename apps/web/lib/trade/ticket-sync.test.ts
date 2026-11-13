import { describe, expect, test } from 'bun:test'

import {
  getTicketSyncAction,
  shouldFollowTicket,
} from '@/lib/trade/ticket-sync'

const synced = { environment: 'paper', symbol: 'AAPL' }

describe('getTicketSyncAction', () => {
  test('opens the screen asset on a ticket holding another asset', () => {
    expect(
      getTicketSyncAction({
        environment: 'paper',
        isSubmitting: false,
        symbol: 'AAPL',
        synced: null,
        ticketSymbol: 'MSFT',
      })
    ).toBe('open')
  })

  test('keeps a ticket that already holds the asset, including its contract', () => {
    expect(
      getTicketSyncAction({
        environment: 'paper',
        isSubmitting: false,
        symbol: 'TSLA',
        synced,
        ticketSymbol: 'TSLA',
      })
    ).toBe('mark')
  })

  test('leaves a cleared ticket alone while the trader searches', () => {
    expect(
      getTicketSyncAction({
        environment: 'paper',
        isSubmitting: false,
        symbol: 'AAPL',
        synced,
        ticketSymbol: undefined,
      })
    ).toBe('none')
  })

  test('waits for a submit to settle, then opens', () => {
    const options = {
      environment: 'paper',
      symbol: 'MSFT',
      synced,
      ticketSymbol: 'AAPL',
    }

    expect(getTicketSyncAction({ ...options, isSubmitting: true })).toBe('none')
    expect(getTicketSyncAction({ ...options, isSubmitting: false })).toBe(
      'open'
    )
  })

  test('reopens after a Paper/Live switch even before the draft clears', () => {
    expect(
      getTicketSyncAction({
        environment: 'live',
        isSubmitting: false,
        symbol: 'AAPL',
        synced,
        ticketSymbol: 'AAPL',
      })
    ).toBe('open')
  })
})

describe('shouldFollowTicket', () => {
  test('follows a newly chosen asset after the screen synced', () => {
    expect(
      shouldFollowTicket({
        previousTicketSymbol: undefined,
        symbol: 'AAPL',
        synced,
        ticketSymbol: 'TSLA',
      })
    ).toBe(true)
  })

  test('ignores the stale ticket from before the sync', () => {
    expect(
      shouldFollowTicket({
        previousTicketSymbol: 'MSFT',
        symbol: 'AAPL',
        synced: null,
        ticketSymbol: 'MSFT',
      })
    ).toBe(false)
    expect(
      shouldFollowTicket({
        previousTicketSymbol: 'MSFT',
        symbol: 'AAPL',
        synced,
        ticketSymbol: 'MSFT',
      })
    ).toBe(false)
  })

  test('does nothing while the ticket is cleared', () => {
    expect(
      shouldFollowTicket({
        previousTicketSymbol: 'AAPL',
        symbol: 'AAPL',
        synced,
        ticketSymbol: undefined,
      })
    ).toBe(false)
  })
})
