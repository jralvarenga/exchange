/** The symbol and account the inline ticket was last set to on the Trade screen. */
export type TicketSync = {
  environment: string
  symbol: string
}

export type TicketSyncAction = 'mark' | 'none' | 'open'

interface GetTicketSyncActionOptions {
  environment: string
  isSubmitting: boolean
  /** The Trade screen's asset, once loaded. */
  symbol?: string
  synced: TicketSync | null
  /** The asset on the ticket, or the stock under its option contract. */
  ticketSymbol?: string
}

interface ShouldFollowTicketOptions {
  previousTicketSymbol?: string
  symbol?: string
  synced: TicketSync | null
  ticketSymbol?: string
}

/**
 * Decides whether the inline ticket needs the screen's asset. It runs once per
 * symbol and account, never because the trader cleared the ticket to search.
 * - `open`: put the screen's asset on the ticket.
 * - `mark`: the ticket already holds it, keep the draft and record the sync.
 * - `none`: nothing to do yet, or an order is still submitting, so retry later.
 */
export function getTicketSyncAction(
  options: GetTicketSyncActionOptions
): TicketSyncAction {
  const { environment, isSubmitting, symbol, synced, ticketSymbol } = options

  if (!symbol || isSubmitting) {
    return 'none'
  }

  if (synced?.symbol === symbol && synced.environment === environment) {
    return 'none'
  }

  // A Paper/Live switch clears the draft right after this render, so it always reopens.
  const sameAccount = synced === null || synced.environment === environment

  return sameAccount && ticketSymbol === symbol ? 'mark' : 'open'
}

/**
 * Returns whether the screen should move to the asset the trader just chose
 * in the ticket. It ignores the ticket's state from before the screen synced.
 */
export function shouldFollowTicket(
  options: ShouldFollowTicketOptions
): boolean {
  const { previousTicketSymbol, symbol, synced, ticketSymbol } = options

  return Boolean(
    symbol &&
      ticketSymbol &&
      synced?.symbol === symbol &&
      ticketSymbol !== symbol &&
      ticketSymbol !== previousTicketSymbol
  )
}
