import { Balance } from '@/components/balance/balance'

/** Renders the initial shell landing surface. */
export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:h-full md:grid-cols-3 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="balance-title"
          className="col-span-2 flex min-h-48 flex-col overflow-hidden rounded-[2rem] bg-primary text-primary-foreground md:h-full md:min-h-0"
        >
          <h2 id="balance-title" className="sr-only">
            Balance
          </h2>
          <Balance />
        </section>

        {/* activity */}
        <section
          aria-labelledby="activity-title"
          className="row-span-2 flex flex-col rounded-2xl bg-background p-4 md:h-full md:min-h-0"
        >
          <h2 id="activity-title" className="font-medium">
            Activity
          </h2>
          <p className="mt-2 text-muted-foreground">
            Recent orders and fills will live here.
          </p>
        </section>

        <section
          aria-labelledby="orders-title"
          className="flex min-h-48 flex-col rounded-2xl bg-background p-4 md:h-full md:min-h-0"
        >
          <h2 id="orders-title" className="font-medium">
            Orders
          </h2>
          <p className="mt-2 text-muted-foreground">
            Working and recent orders will live here.
          </p>
        </section>

        <section
          aria-labelledby="news-title"
          className="flex min-h-48 flex-col rounded-2xl bg-background p-4 md:h-full md:min-h-0"
        >
          <h2 id="news-title" className="font-medium">
            News
          </h2>
          <p className="mt-2 text-muted-foreground">
            Headlines and catalysts will live here.
          </p>
        </section>
      </div>
    </div>
  )
}
