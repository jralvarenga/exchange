import { TradeScreen } from '@/components/trade/trade-screen'
import { decodeTradeSymbol } from '@/lib/trade/symbol'

interface Props {
  params: Promise<{ symbol: string }>
}

/** Renders the Trade screen for one stock or crypto pair. */
export default async function TradeSymbol({ params }: Props) {
  const { symbol } = await params

  return <TradeScreen identifier={decodeTradeSymbol(symbol)} />
}
