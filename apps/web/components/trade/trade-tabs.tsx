'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import dynamic from 'next/dynamic'

import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'

// Each panel's code loads only when its tab is first opened.
const TradeCorporateActions = dynamic(
  () =>
    import('@/components/trade/trade-corporate-actions').then(
      (module) => module.TradeCorporateActions
    ),
  { loading: () => <TradeRowsFallback label="Loading corporate actions" /> }
)
const TradeNews = dynamic(
  () =>
    import('@/components/trade/trade-news').then((module) => module.TradeNews),
  { loading: () => <TradeRowsFallback label="Loading news" /> }
)
const TradeOrderbook = dynamic(
  () =>
    import('@/components/trade/trade-orderbook').then(
      (module) => module.TradeOrderbook
    ),
  { loading: () => <TradeRowsFallback label="Loading order book" /> }
)
const TradeTrades = dynamic(
  () =>
    import('@/components/trade/trade-trades').then(
      (module) => module.TradeTrades
    ),
  { loading: () => <TradeRowsFallback label="Loading recent trades" /> }
)

interface Props {
  isCrypto: boolean
  symbol: string
}

type TradeTab = 'actions' | 'news' | 'orderbook' | 'trades'

interface TabOption {
  label: string
  value: TradeTab
}

/** Returns the tabs an asset supports, News first: the order book for crypto, corporate actions for stocks. */
function getTabs(isCrypto: boolean): TabOption[] {
  return isCrypto
    ? [
        { label: 'News', value: 'news' },
        { label: 'Order book', value: 'orderbook' },
        { label: 'Trades', value: 'trades' },
      ]
    : [
        { label: 'News', value: 'news' },
        { label: 'Trades', value: 'trades' },
        { label: 'Corporate actions', value: 'actions' },
      ]
}

/** Switches between the market activity panels. Only the open panel loads data. */
export function TradeTabs({ isCrypto, symbol }: Props) {
  const tabs = getTabs(isCrypto)

  return (
    <section aria-labelledby="trade-tabs-title" className="flex flex-col gap-3">
      <h2 className="font-bold text-xl tracking-tight" id="trade-tabs-title">
        Market activity
      </h2>
      <Tabs defaultValue="news" key={symbol}>
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="rounded-full group-data-horizontal/tabs:h-10">
            {tabs.map((tab) => (
              <TabsTrigger
                className="rounded-full px-3.5 text-base"
                key={tab.value}
                value={tab.value}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {isCrypto ? (
          <TabsContent className="text-base" value="orderbook">
            <TradeOrderbook symbol={symbol} />
          </TabsContent>
        ) : null}
        <TabsContent className="text-base" value="trades">
          <TradeTrades symbol={symbol} />
        </TabsContent>
        <TabsContent className="text-base" value="news">
          <TradeNews symbol={symbol} />
        </TabsContent>
        {isCrypto ? null : (
          <TabsContent className="text-base" value="actions">
            <TradeCorporateActions symbol={symbol} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  )
}
