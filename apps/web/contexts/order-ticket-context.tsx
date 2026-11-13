'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { searchAssets } from '@/hooks/use-asset-search'
import { useCreateOrder } from '@/hooks/use-create-order'
import type { CreateOrderRequest } from '@/lib/alpaca/schemas'
import { showSuccessToast } from '@/lib/app-toast'
import { isTradePath } from '@/lib/navigation'
import {
  createTicketDraft,
  openTicketDraft,
  reconcileTicket,
  selectTicketAsset,
} from '@/lib/order-ticket/draft'
import { isSameTicketSubmission } from '@/lib/order-ticket/request'
import type { TradeLock } from '@/lib/workspaces/permissions'
import type {
  OpenTicketOptions,
  TicketDraft,
} from '@/models/order-ticket/ticket'

export interface TicketContextValue {
  /** False when `tradeLock` is set. */
  canTrade: boolean
  clearOrderMessages: () => void
  closeTicket: () => void
  draft: TicketDraft
  environment: 'live' | 'paper'
  isOpen: boolean
  isResolving: boolean
  isSubmitting: boolean
  orderError: string | null
  orderSuccess: string | null
  /** Resolves true once the broker accepts the order. */
  submitOrder: (request: CreateOrderRequest) => Promise<boolean>
  openTicket: (options?: OpenTicketOptions) => Promise<void>
  /** Why this person cannot trade on the active connection, if they cannot. */
  tradeLock: TradeLock | null
  updateDraft: (patch: Partial<TicketDraft>) => void
}

interface Props {
  children: ReactNode
  environment: 'live' | 'paper'
  tradeLock: TradeLock | null
}

export const OrderTicketContext = createContext<TicketContextValue | null>(null)

/** Shares one persistent draft between every ticket placement and entry point. */
export function OrderTicketProvider({
  children,
  environment,
  tradeLock,
}: Props) {
  const [draft, setDraft] = useState(createTicketDraft)
  const [isOpen, setIsOpen] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const createOrder = useCreateOrder()
  const submitting = useRef(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const resolution = useRef<AbortController | null>(null)
  // One idempotency key per draft, so a retried request can't place a second order.
  const orderKey = useRef<string | null>(null)
  const pathname = usePathname()
  const inline = isTradePath(pathname)
  const draftRef = useRef(draft)
  const environmentRef = useRef(environment)
  // Ignore an in-flight order after the trader switches accounts.
  const submitEpoch = useRef(0)
  // Drop the previous account's order before paint. The shell stays mounted so
  // the credentials gate can clear that account's cached queries.
  useLayoutEffect(() => {
    if (environmentRef.current === environment) return
    environmentRef.current = environment
    submitEpoch.current += 1
    submitting.current = false
    resolution.current?.abort()
    orderKey.current = null
    const reset = createTicketDraft()
    draftRef.current = reset
    setDraft(reset)
    setIsOpen(false)
    setIsResolving(false)
    setOrderError(null)
    setOrderSuccess(null)
  }, [environment])

  // The Trade page shows the ticket inline, so a floating copy would duplicate it.
  useEffect(() => {
    if (inline) setIsOpen(false)
  }, [inline])

  /** Hides the last order's success or failure message. */
  function clearOrderMessages(): void {
    setOrderError(null)
    setOrderSuccess(null)
  }

  /** Applies dependent asset constraints together with a user edit. */
  function updateDraft(patch: Partial<TicketDraft>): void {
    if (submitting.current) return
    resolution.current?.abort()
    setIsResolving(false)
    clearOrderMessages()
    orderKey.current = null
    const next = applyDraftPatch({ current: draftRef.current, patch })
    draftRef.current = next
    setDraft(next)
  }

  /** Opens immediately and resolves a symbol without letting older searches win. */
  async function openTicket(options: OpenTicketOptions = {}): Promise<void> {
    if (submitting.current) return
    resolution.current?.abort()
    if (!isOpen && !inline)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    if (!inline) setIsOpen(true)
    clearOrderMessages()
    const current = draftRef.current
    const opened = openTicketDraft({ current, options })
    if (!isSameTicketSubmission({ current, next: opened.draft }))
      orderKey.current = null
    draftRef.current = opened.draft
    setDraft(opened.draft)
    if (!opened.needsLookup) {
      setIsResolving(false)
      return
    }
    const query = options.assetIdentifier?.trim() ?? ''
    const identifier = query.toLowerCase()
    const controller = new AbortController()
    resolution.current = controller
    setIsResolving(true)
    try {
      const result = await searchAssets({
        query,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      const asset = result.assets.find(
        (candidate) =>
          candidate.id.toLowerCase() === identifier ||
          candidate.symbol.toLowerCase() === identifier
      )
      if (asset) {
        const next = selectTicketAsset({
          asset,
          draft: draftRef.current,
        })
        if (!isSameTicketSubmission({ current: draftRef.current, next }))
          orderKey.current = null
        draftRef.current = next
        setDraft(next)
      }
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
  async function submitOrder(request: CreateOrderRequest): Promise<boolean> {
    if (submitting.current) return false
    const epoch = submitEpoch.current
    submitting.current = true
    clearOrderMessages()
    orderKey.current ??= crypto.randomUUID()
    try {
      await createOrder.mutateAsync({
        ...request,
        clientOrderId: orderKey.current,
      })
      const message = `${request.side === 'buy' ? 'Buy' : 'Sell'} order submitted for ${request.symbol}`
      showSuccessToast({
        title: message,
        description: `Sent to your ${environment} account.`,
      })
      if (epoch !== submitEpoch.current) return false
      setOrderSuccess(message)
      orderKey.current = null
      const next = { ...draftRef.current, amount: '' }
      draftRef.current = next
      setDraft(next)
      return true
    } catch (error) {
      if (epoch !== submitEpoch.current) return false
      setOrderError(
        error instanceof Error
          ? error.message
          : 'Unable to place the order. Try again.'
      )
      return false
    } finally {
      if (epoch === submitEpoch.current) submitting.current = false
    }
  }

  return (
    <OrderTicketContext
      value={{
        canTrade: tradeLock === null,
        clearOrderMessages,
        closeTicket,
        draft,
        environment,
        isOpen,
        isResolving,
        isSubmitting: createOrder.isPending && submitting.current,
        orderError,
        orderSuccess,
        submitOrder,
        openTicket,
        tradeLock,
        updateDraft,
      }}
    >
      {children}
    </OrderTicketContext>
  )
}

interface ApplyDraftPatchOptions {
  current: TicketDraft
  patch: Partial<TicketDraft>
}

/** Merges an edit and clears a size that would be misread after a unit switch. */
function applyDraftPatch({
  current,
  patch,
}: ApplyDraftPatchOptions): TicketDraft {
  const selected =
    patch.asset !== undefined
      ? selectTicketAsset({ asset: patch.asset, draft: current })
      : current
  const next = reconcileTicket({ ...selected, ...patch })
  return current.quantityMode !== next.quantityMode &&
    patch.amount === undefined
    ? { ...next, amount: '' }
    : next
}

/** Reads the shared ticket controls beneath the authenticated shell. */
export function useOrderTicket(): TicketContextValue {
  const context = useContext(OrderTicketContext)
  if (!context) throw new Error('useOrderTicket requires OrderTicketProvider.')
  return context
}
