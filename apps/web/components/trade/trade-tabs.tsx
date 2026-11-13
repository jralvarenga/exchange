'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'

import { TradeCorporateActions } from '@/components/trade/trade-corporate-actions'
import { TradeNews } from '@/components/trade/trade-news'
import { TradeOrderbook } from '@/components/trade/trade-orderbook'
import { TradeTrades } from '@/components/trade/trade-trades'

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
    <section aria-labelledby="trade-tabs-title" className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl tracking-tight" id="trade-tabs-title">
        Market activity
      </h2>
      <Tabs defaultValue="news" key={symbol}>
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="rounded-full group-data-horizontal/tabs:h-11">
            {tabs.map((tab) => (
              <TabsTrigger
                className="rounded-full px-4 text-base"
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
