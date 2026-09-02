import { DataTableFallback } from '@/components/data-table-fallback'

/** Reserves the orders table while account orders load. */
export function PortfolioOrdersFallback() {
  return <DataTableFallback />
}
