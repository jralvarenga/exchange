import { Skeleton } from '@workspace/ui/components/skeleton'

const legendRows = ['holding-one', 'holding-two', 'holding-three']

/** Reserves the portfolio card while holdings resolve behind Suspense. */
export function PortfolioCardFallback() {
  return (
    <section
      aria-labelledby="portfolio-loading-title"
      className="rounded-3xl bg-card p-5 ring-1 ring-foreground/5"
    >
      <h2 className="font-bold text-2xl" id="portfolio-loading-title">
        Portfolio
      </h2>
      <div className="mt-5 grid items-center gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <Skeleton className="mx-auto aspect-square w-full max-w-56 rounded-full" />
        <div className="flex flex-col gap-3">
          {legendRows.map((row) => (
            <Skeleton className="h-10 w-full rounded-2xl" key={row} />
          ))}
        </div>
      </div>
    </section>
  )
}
