'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowUpRight, Newspaper } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SectionUnavailable } from '@/components/section-unavailable'
import { TradePanelEmpty } from '@/components/trade/trade-panel-empty'
import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'
import { useMarketNews } from '@/hooks/use-market-news'
import { formatRelativeTime } from '@/lib/trade/format'
import { getNewsSymbol } from '@/lib/trade/symbol'
import { revealClassName } from '@/lib/utils'

interface Props {
  symbol: string
}

/** Lists the latest headlines that mention a symbol, linking out to each story. */
export function TradeNews({ symbol }: Props) {
  const news = useMarketNews({ limit: 10, symbols: [getNewsSymbol(symbol)] })
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)

    return () => window.clearInterval(timer)
  }, [])

  if (news.isPending) {
    return <TradeRowsFallback label="Loading news" />
  }

  if (news.isError) {
    return (
      <SectionUnavailable
        label="News unavailable."
        onRetry={() => void news.refetch()}
      />
    )
  }

  if (news.data.length === 0) {
    return (
      <TradePanelEmpty
        hint="Headlines that mention this asset will show up here."
        icon={Newspaper}
        title={`No recent news for ${symbol}.`}
      />
    )
  }

  return (
    <ul className={cn('flex flex-col', revealClassName)}>
      {news.data.map((article) => {
        const meta = [
          article.source,
          formatRelativeTime({ now, timestamp: article.createdAt }),
        ]
          .filter(Boolean)
          .join(' · ')
        const content = (
          <>
            <span className="flex items-start justify-between gap-3">
              <span className="font-bold text-lg leading-snug">
                {article.headline}
              </span>
              {article.url ? (
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                />
              ) : null}
            </span>
            {article.summary ? (
              <span className="line-clamp-2 text-muted-foreground">
                {article.summary}
              </span>
            ) : null}
            <span className="text-muted-foreground">{meta}</span>
          </>
        )

        return (
          <li key={article.id}>
            {article.url ? (
              <a
                className="group -mx-3 flex flex-col gap-1 rounded-2xl px-3 py-4 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
                href={article.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {content}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <div className="flex flex-col gap-1 py-4">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
