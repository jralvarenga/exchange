import { buttonVariants } from '@workspace/ui/components/button'
import { ArrowUpRight, Landmark } from 'lucide-react'

const ALPACA_SIGN_IN_URL = 'https://app.alpaca.markets/login'
const ALPACA_SIGN_UP_URL = 'https://app.alpaca.markets/signup'

/**
 * Tells someone creating a workspace that trading runs through their own
 * Alpaca account, with links to sign in to it or open one.
 */
export function AlpacaRequirement() {
  return (
    <aside
      aria-labelledby="alpaca-requirement-title"
      className="flex gap-4 border-border border-y py-6"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"
      >
        <Landmark className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-lg" id="alpaca-requirement-title">
            An Alpaca account is required
          </h2>
          <p className="text-muted-foreground">
            Treid reads balances and places orders through your own Alpaca
            account. You'll add its API keys in the next step. Paper trading is
            free and needs no deposit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
            href={ALPACA_SIGN_IN_URL}
            rel="noreferrer"
            target="_blank"
          >
            Sign in to Alpaca
            <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            className={buttonVariants({ size: 'lg', variant: 'ghost' })}
            href={ALPACA_SIGN_UP_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open an account
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
