'use client'

import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
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
        <Link
          className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
          href="/portfolio"
        >
          View portfolio
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <AssetsTable assets={positions} limitShown={5} />
    </section>
  )
}
