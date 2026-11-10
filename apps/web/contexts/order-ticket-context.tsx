'use client'

import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from 'react'

import { searchAssets } from '@/hooks/use-asset-search'
import { useCreateOrder } from '@/hooks/use-create-order'
import type { CreateOrderRequest } from '@/lib/alpaca/schemas'
import { showSuccessToast } from '@/lib/app-toast'
import {
  createTicketDraft,
  reconcileTicket,
  selectTicketAsset,
} from '@/lib/order-ticket/utils'
import type {
  OpenTicketOptions,
  TicketDraft,
} from '@/models/order-ticket/ticket'

interface TicketContextValue {
  closeTicket: () => void
  draft: TicketDraft
  environment: 'live' | 'paper'
  isOpen: boolean
  isResolving: boolean
  isSubmitting: boolean
  orderError: string | null
  orderSuccess: string | null
  submitOrder: (request: CreateOrderRequest) => Promise<void>
  openTicket: (options?: OpenTicketOptions) => Promise<void>
  updateDraft: (patch: Partial<TicketDraft>) => void
}

interface Props {
  children: ReactNode
  environment: 'live' | 'paper'
}

export const OrderTicketContext = createContext<TicketContextValue | null>(null)

/** Shares one persistent draft between every ticket placement and entry point. */
export function OrderTicketProvider({ children, environment }: Props) {
  const [draft, setDraft] = useState(createTicketDraft)
  const [isOpen, setIsOpen] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const createOrder = useCreateOrder()
  const submitting = useRef(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const resolution = useRef<AbortController | null>(null)

  /** Applies dependent asset constraints together with a user edit. */
  function updateDraft(patch: Partial<TicketDraft>): void {
    if (submitting.current) return
    resolution.current?.abort()
    setIsResolving(false)
    setOrderError(null)
    setOrderSuccess(null)
    setDraft((current) => {
      const selected =
        patch.asset !== undefined
          ? selectTicketAsset(current, patch.asset)
          : current
      const next = reconcileTicket({ ...selected, ...patch })
      // A unit switch without a converted amount would misread the old size.
      return current.quantityMode !== next.quantityMode &&
        patch.amount === undefined
        ? { ...next, amount: '' }
        : next
    })
  }

  /** Opens immediately and resolves a symbol without letting older searches win. */
  async function openTicket(options: OpenTicketOptions = {}): Promise<void> {
    if (submitting.current) return
    resolution.current?.abort()
    if (!isOpen)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    setIsOpen(true)
    setIsResolving(false)
    setDraft((current) =>
      reconcileTicket({
        ...(options.asset
          ? selectTicketAsset(current, options.asset)
          : current),
        ...(options.asset ? { asset: options.asset } : {}),
        ...(options.side
          ? {
              side: options.side,
              positionIntent:
                options.side === 'buy' ? 'buy_to_open' : 'sell_to_close',
            }
          : {}),
      })
    )
    if (!options.assetIdentifier || options.asset) return
    const identifier = options.assetIdentifier.trim().toLowerCase()
    const controller = new AbortController()
    resolution.current = controller
    setIsResolving(true)
    setDraft((current) => selectTicketAsset(current, null))
    try {
      const result = await searchAssets({
        query: identifier,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      const asset = result.assets.find(
        (candidate) =>
          candidate.id.toLowerCase() === identifier ||
          candidate.symbol.toLowerCase() === identifier
      )
      if (asset) setDraft((current) => selectTicketAsset(current, asset))
    } catch {
      // Keep the symbol picker available when lookup fails.
    } finally {
      if (!controller.signal.aborted) setIsResolving(false)
    }
  }

  /** Dismisses the surface while retaining the draft for the next visit. */
  function closeTicket(): void {
    resolution.current?.abort()
    setIsResolving(false)
    setIsOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus())
  }

  /** Serializes submissions across responsive remounts and preserves broker errors. */
  async function submitOrder(request: CreateOrderRequest): Promise<void> {
    if (submitting.current) return
    submitting.current = true
    setOrderError(null)
    setOrderSuccess(null)
    try {
      await createOrder.mutateAsync(request)
      const message = `${request.side === 'buy' ? 'Buy' : 'Sell'} order submitted for ${request.symbol}`
      setOrderSuccess(message)
      showSuccessToast({
        title: message,
        description: `Sent to your ${environment} account.`,
      })
      setDraft((current) => ({ ...current, amount: '' }))
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : 'Unable to place the order. Try again.'
      )
    } finally {
      submitting.current = false
    }
  }

  return (
    <OrderTicketContext
      value={{
        closeTicket,
        draft,
        environment,
        isOpen,
        isResolving,
        isSubmitting: createOrder.isPending,
        orderError,
        orderSuccess,
        submitOrder,
        openTicket,
        updateDraft,
      }}
    >
      {children}
    </OrderTicketContext>
  )
}

/** Reads the shared ticket controls beneath the authenticated shell. */
export function useOrderTicket(): TicketContextValue {
  const context = useContext(OrderTicketContext)
  if (!context) throw new Error('useOrderTicket requires OrderTicketProvider.')
  return context
}
