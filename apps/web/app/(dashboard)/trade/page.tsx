import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { defaultTradeSymbol, getTradeHref } from '@/lib/trade/symbol'

export const metadata: Metadata = {
  title: 'Trade',
}

/** Opens the Trade screen on the default symbol. */
export default function Trade() {
  redirect(getTradeHref(defaultTradeSymbol))
}
