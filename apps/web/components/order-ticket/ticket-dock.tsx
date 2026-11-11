'use client'

import { Button } from '@workspace/ui/components/button'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { OrderTicket } from '@/components/order-ticket/order-ticket'
import { useOrderTicket } from '@/contexts/order-ticket-context'

/** Docks the ticket beside the desktop workspace, scrolling it without a second scrollbar. */
export function TicketDock() {
  const { closeTicket } = useOrderTicket()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  return (
    <aside
      aria-labelledby="ticket-dock-title"
      className="sticky top-24 flex h-[calc(100dvh-7rem)] w-100 shrink-0 flex-col border-l"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeTicket()
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 pr-1 pb-4 pl-6">
        <h2
          className="font-bold text-2xl tracking-tight outline-none"
          id="ticket-dock-title"
          ref={heading}
          tabIndex={-1}
        >
          Order ticket
        </h2>
        <Button
          aria-label="Close order ticket"
          onClick={closeTicket}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="scroll-fade-top scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2 pr-1 pl-6">
        <OrderTicket />
      </div>
    </aside>
  )
}
