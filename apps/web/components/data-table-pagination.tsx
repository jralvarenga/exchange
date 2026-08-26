import { Button } from '@workspace/ui/components/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  canNextPage: boolean
  canPreviousPage: boolean
  onNextPage: () => void
  onPreviousPage: () => void
  pageIndex: number
  pageSize: number
  rowCount: number
}

/** Shows which rows are on screen and moves between API-backed table pages. */
export function DataTablePagination({
  canNextPage,
  canPreviousPage,
  onNextPage,
  onPreviousPage,
  pageIndex,
  pageSize,
  rowCount,
}: Props) {
  const start = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const end = pageIndex * pageSize + rowCount

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
    >
      <p className="text-muted-foreground">
        {rowCount === 0 ? 'No rows to show' : `Showing ${start}–${end}`}
      </p>
      <div className="flex gap-2">
        <Button
          aria-label="Previous page"
          disabled={!canPreviousPage}
          onClick={onPreviousPage}
          size="lg"
          type="button"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <Button
          aria-label="Next page"
          disabled={!canNextPage}
          onClick={onNextPage}
          size="lg"
          type="button"
          variant="outline"
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
