import { PortfolioCard } from '@/components/portfolio/portfolio-card'

/** Renders the portfolio overview with assets, orders, and activity tabs. */
export default function PortfolioPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PortfolioCard />
    </div>
  )
}
