import { redirect } from 'next/navigation'

import { defaultTradeSymbol, getTradeHref } from '@/lib/trade/symbol'

/** Opens the Trade screen on the default symbol. */
export default function Trade() {
  redirect(getTradeHref(defaultTradeSymbol))
}
