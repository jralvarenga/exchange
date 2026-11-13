import Image from 'next/image'

import { Logo } from '@/components/logo'
import { getAssetLogoUrl } from '@/lib/assets/logo'

/** Stocks and ETFs from different issuers, so no two logos look alike. */
const symbols = [
  'NVDA',
  'SPY',
  'TSLA',
  'QQQ',
  'META',
  'VOO',
  'GOOGL',
  'IWM',
  'AAPL',
  'SCHD',
  'AMZN',
  'ARKK',
  'MSFT',
]

/** The strip twice over, so the marquee loops without a gap. */
const marqueeItems = [0, 1].flatMap((copy) =>
  symbols.map((symbol) => ({ copy, symbol }))
)

/**
 * The brand panel beside every auth form: the pitch over slowly drifting violet glows,
 * and a slow strip of the stocks and ETFs people trade with Exchange.
 */
export function AuthShowcase() {
  return (
    <aside
      aria-label="About Exchange"
      className="sticky top-3 isolate hidden h-[calc(100svh-1.5rem)] flex-col justify-between overflow-hidden rounded-[2rem] bg-primary p-10 text-primary-foreground lg:flex"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -inset-1/4 animate-[spin_60s_linear_infinite] motion-reduce:animate-none">
          <span className="absolute top-0 left-0 size-[60%] animate-glow-drift rounded-full bg-chart-1 opacity-60 blur-3xl [--drift-duration:12s] [--drift-x:45%] [--drift-y:30%]" />
          <span className="absolute top-1/4 right-0 size-[55%] animate-glow-drift rounded-full bg-chart-5 opacity-90 blur-3xl [--drift-duration:15s] [--drift-x:-40%] [--drift-y:35%]" />
          <span className="absolute bottom-0 left-1/4 size-[50%] animate-glow-drift rounded-full bg-chart-2 opacity-80 blur-3xl [--drift-duration:10s] [--drift-x:35%] [--drift-y:-40%]" />
          <span className="absolute top-1/2 left-0 size-[35%] animate-glow-drift rounded-full bg-chart-3 opacity-70 blur-2xl [--drift-duration:14s] [--drift-x:60%] [--drift-y:-25%]" />
        </div>
      </div>

      <Logo tone="inverse" />

      <div className="flex max-w-md flex-col gap-4">
        <p className="text-lg opacity-80">Your Alpaca desk</p>
        <p className="text-balance font-bold text-5xl leading-[0.95] tracking-tighter xl:text-6xl">
          Trade on Alpaca <span className="opacity-60">without the noise.</span>
        </p>
        <p className="text-lg opacity-80">
          Paper or live, on your own or with your team.
        </p>
      </div>

      <div className="-mx-10 flex flex-col items-center gap-5">
        <p className="opacity-80">Trade the names you know</p>
        <div className="mask-x-from-80% mask-x-to-100% w-full overflow-hidden">
          <ul
            aria-label="Stocks and ETFs you can trade"
            className="flex w-max animate-marquee gap-4 [--marquee-duration:50s]"
          >
            {marqueeItems.map(({ copy, symbol }) => (
              <li
                aria-hidden={copy === 1 ? true : undefined}
                className="size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-primary-foreground/20"
                key={`${copy}-${symbol}`}
              >
                <Image
                  alt={copy === 1 ? '' : symbol}
                  className="size-full object-cover"
                  height={48}
                  src={getAssetLogoUrl({ assetClass: 'us_equity', symbol })}
                  width={48}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
