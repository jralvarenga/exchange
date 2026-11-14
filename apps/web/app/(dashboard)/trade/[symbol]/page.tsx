import type { Metadata } from 'next'

import { TradeScreen } from '@/components/trade/trade-screen'
import { decodeTradeSymbol, getTradeTitle } from '@/lib/trade/symbol'

interface Props {
  params: Promise<{ symbol: string }>
}

/** Titles the tab with the symbol being traded, such as `AAPL · Trade`. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params

  return { title: getTradeTitle(decodeTradeSymbol(symbol)) }
}

/** Renders the Trade screen for one stock or crypto pair. */
export default async function TradeSymbol({ params }: Props) {
  const { symbol } = await params

  return <TradeScreen identifier={decodeTradeSymbol(symbol)} />
}
