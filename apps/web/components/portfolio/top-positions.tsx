'use client'

import { Button } from '@workspace/ui/components/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { AssetsTable } from '@/components/portfolio/assets-table'
import { usePortfolio } from '@/hooks/use-portfolio'

/** Displays the five largest open positions by absolute market value. */
export function TopPositions() {
  const { data: portfolio } = usePortfolio()
  const positions = [...portfolio.positions].sort(
    (left, right) => Math.abs(right.marketValue) - Math.abs(left.marketValue)
  )

  return (
    <section aria-labelledby="top-positions-title" className="mt-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-bold text-2xl" id="top-positions-title">
          Top positions
        </h2>
        <Button render={<Link href="/portfolio" />} size="lg" variant="outline">
          View portfolio
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <AssetsTable assets={positions} limitShown={5} />
    </section>
  )
}
