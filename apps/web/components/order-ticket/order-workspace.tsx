'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@workspace/ui/components/drawer'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@workspace/ui/components/sheet'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { OrderTicket } from '@/components/order-ticket/order-ticket'
import { TicketDock } from '@/components/order-ticket/ticket-dock'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { useMediaQuery } from '@/hooks/use-media-query'

interface Props {
  children: ReactNode
}

/** Places one ticket in a desktop dock, tablet sheet, or full-height mobile drawer. */
export function OrderWorkspace({ children }: Props) {
  const { isOpen, closeTicket } = useOrderTicket()
  const desktop = useMediaQuery('(min-width: 1280px)')
  const tablet = useMediaQuery('(min-width: 768px)')
  const pathname = usePathname()
  const inline = pathname === '/trade'
  return (
    <div className="flex min-w-0 flex-1 items-start gap-8">
      <div className="@container flex min-w-0 flex-1 flex-col self-stretch">
        {children}
      </div>
      {isOpen && !inline && desktop ? <TicketDock /> : null}
      {!inline && !desktop && tablet ? (
        <Sheet
          onOpenChange={(open) => {
            if (!open) closeTicket()
          }}
          open={isOpen}
        >
          <SheetContent
            className="scrollbar-none gap-0 overflow-y-auto bg-background px-6 pt-6 pb-0 data-[side=right]:w-112 motion-reduce:transition-none data-[side=right]:sm:max-w-none"
            showCloseButton={false}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <SheetTitle className="font-bold text-2xl tracking-tight">
                Order ticket
              </SheetTitle>
              <SheetClose
                render={
                  <Button
                    aria-label="Close order ticket"
                    size="icon"
                    variant="ghost"
                  />
                }
              >
                <X aria-hidden="true" />
              </SheetClose>
            </div>
            <SheetDescription className="sr-only">
              Configure and submit an order to your active account.
            </SheetDescription>
            <OrderTicket />
          </SheetContent>
        </Sheet>
      ) : null}
      {!inline && !tablet ? (
        <Drawer
          onOpenChange={(open) => {
            if (!open) closeTicket()
          }}
          open={isOpen}
        >
          <DrawerContent className="inset-x-0 bottom-0 h-dvh max-h-dvh w-full rounded-t-[2rem] bg-background [--drawer-content-height:100dvh] [--drawer-content-max-height:100dvh] motion-reduce:transition-none">
            <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
                <DrawerTitle className="font-bold text-2xl tracking-tight">
                  Order ticket
                </DrawerTitle>
                <DrawerClose
                  render={
                    <Button
                      aria-label="Close order ticket"
                      size="icon"
                      variant="ghost"
                    />
                  }
                >
                  <X aria-hidden="true" />
                </DrawerClose>
              </div>
              <DrawerDescription className="sr-only">
                Configure and submit an order to your active account.
              </DrawerDescription>
              <OrderTicket />
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  )
}
