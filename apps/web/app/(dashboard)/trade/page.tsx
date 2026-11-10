import { ArrowUpRight } from 'lucide-react'

import { OrderTicket } from '@/components/order-ticket/order-ticket'

/** Offers a dedicated, inline trading surface using the shared order draft. */
export default function Trade() {
  return (
    <div className="flex flex-col gap-10 py-4 md:pl-24 xl:flex-row xl:gap-24">
      <div className="flex flex-1 flex-col gap-5 xl:sticky xl:top-28 xl:self-start">
        <div
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-muted"
        >
          <ArrowUpRight className="size-6" />
        </div>
        <h1 className="font-bold text-5xl tracking-tighter md:text-6xl">
          Your next move.
        </h1>
        <p className="max-w-88 text-lg text-muted-foreground">
          Choose an asset. Set your terms. Place an order with everything in
          view.
        </p>
        <p className="max-w-88 border-t pt-5 text-muted-foreground">
          From a simple market order to linked exits, your ticket adapts to the
          way you trade.
        </p>
      </div>
      <section
        aria-label="Order ticket"
        className="w-full max-w-xl xl:w-112 xl:shrink-0 xl:border-l xl:pl-8"
      >
        <OrderTicket />
      </section>
    </div>
  )
}
