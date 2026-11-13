import { permanentRedirect } from 'next/navigation'

import { decodeTradeSymbol, getTradeHref } from '@/lib/trade/symbol'

interface Props {
  params: Promise<{ id: string }>
}

/** Sends old asset links to the Trade screen, which accepts a symbol or an asset id. */
export default async function AssetDetail({ params }: Props) {
  const { id } = await params

  permanentRedirect(getTradeHref(decodeTradeSymbol(id)))
}
