import { buttonVariants } from '@workspace/ui/components/button'
import {
  ExternalLink,
  FileText,
  FlaskConical,
  Landmark,
  ReceiptText,
} from 'lucide-react'

import { PortfolioDocumentRow } from '@/components/portfolio/portfolio-document-row'
import { PortfolioTabPanel } from '@/components/portfolio/portfolio-tab-panel'

interface Props {
  environment: 'live' | 'paper'
}

const ALPACA_DASHBOARD_URL = 'https://app.alpaca.markets'

const documents = [
  {
    detail: 'Every month, after the first weekend of the next one',
    icon: FileText,
    label: 'Account statements',
  },
  {
    detail: 'The day after each trade',
    icon: ReceiptText,
    label: 'Trade confirmations',
  },
  {
    detail: 'Each year, for accounts with sales or income to report',
    icon: Landmark,
    label: 'Tax forms',
  },
]

/**
 * Explains which documents Alpaca issues and sends the trader to its
 * dashboard for them: Alpaca does not share documents with apps connected
 * through Trading API keys, and paper accounts get none.
 */
export function PortfolioDocuments({ environment }: Props) {
  if (environment === 'paper') {
    return (
      <PortfolioTabPanel>
        <div className="flex flex-col items-start gap-2 py-8" role="status">
          <FlaskConical
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
          <p className="font-medium">Paper accounts have no documents</p>
          <p className="max-w-prose text-muted-foreground">
            Alpaca only issues statements, trade confirmations and tax forms for
            live accounts. Switch to a live connection to see where to find
            them.
          </p>
        </div>
      </PortfolioTabPanel>
    )
  }

  return (
    <PortfolioTabPanel>
      <p className="max-w-prose text-lg text-muted-foreground">
        Alpaca keeps your documents in the Account tab of its dashboard. It
        doesn't share them with apps connected through API keys, so they open
        there.
      </p>
      <ul className="flex flex-col divide-y divide-border border-border border-y">
        {documents.map((document) => (
          <PortfolioDocumentRow
            detail={document.detail}
            icon={document.icon}
            key={document.label}
            label={document.label}
          />
        ))}
      </ul>
      <a
        className={buttonVariants({
          className: 'self-start',
          size: 'xl',
          variant: 'outline',
        })}
        href={ALPACA_DASHBOARD_URL}
        rel="noreferrer"
        target="_blank"
      >
        Open documents in Alpaca
        <ExternalLink aria-hidden="true" data-icon="inline-end" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </PortfolioTabPanel>
  )
}
