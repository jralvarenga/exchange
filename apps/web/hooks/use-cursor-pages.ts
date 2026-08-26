import { useState } from 'react'

interface CursorPages {
  goNext: (nextToken: string) => void
  goPrevious: () => void
  pageIndex: number
  pageToken: string | undefined
}

/** Remembers cursor tokens so a table can page forward and back through an API. */
export function useCursorPages(): CursorPages {
  const [pageIndex, setPageIndex] = useState(0)
  const [tokens, setTokens] = useState<Array<string | undefined>>([undefined])

  function goNext(nextToken: string): void {
    setTokens((current) =>
      current.length > pageIndex + 1 ? current : [...current, nextToken]
    )
    setPageIndex((index) => index + 1)
  }

  function goPrevious(): void {
    setPageIndex((index) => Math.max(0, index - 1))
  }

  return {
    goNext,
    goPrevious,
    pageIndex,
    pageToken: tokens[pageIndex],
  }
}
