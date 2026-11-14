import { buttonVariants } from '@workspace/ui/components/button'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'

const ALPACA_URL = 'https://app.alpaca.markets'

/**
 * Tells someone creating a workspace that trading runs through their own
 * Alpaca account, with a link to sign in to it or open one.
 */
export function AlpacaRequirement() {
  return (
    <aside
      aria-label="Alpaca account required"
      className="flex flex-col gap-4 border-border border-y py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-3">
        <Image
          alt="Alpaca"
          className="h-7 w-auto self-start dark:hidden"
          height={309}
          src="/brands/alpaca.svg"
          width={1081}
        />
        <Image
          alt="Alpaca"
          className="hidden h-7 w-auto self-start dark:block"
          height={309}
          src="/brands/alpaca-dark.svg"
          width={1081}
        />
        <p className="text-muted-foreground">
          You need an Alpaca account to trade. Paper trading is free.
        </p>
      </div>
      <a
        className={buttonVariants({
          className: 'self-start sm:self-auto',
          size: 'lg',
          variant: 'outline',
        })}
        href={ALPACA_URL}
        rel="noreferrer"
        target="_blank"
      >
        Go to Alpaca
        <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </aside>
  )
}
