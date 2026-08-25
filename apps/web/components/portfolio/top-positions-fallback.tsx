import { Skeleton } from '@workspace/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'

const fallbackRows = [
  'position-one',
  'position-two',
  'position-three',
  'position-four',
  'position-five',
]

/** Reserves the top-positions table while the portfolio request resolves. */
export function TopPositionsFallback() {
  return (
    <section aria-labelledby="top-positions-loading-title" className="mt-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-bold text-2xl" id="top-positions-loading-title">
          Top positions
        </h2>
        <Skeleton className="h-11 w-32 rounded-2xl" />
      </div>
      <div className="overflow-hidden rounded-3xl">
        <Table className="min-w-3xl">
          <TableHeader>
            <TableRow>
              {['Asset', 'Price', 'Quantity', 'Market value', 'Total P/L'].map(
                (heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fallbackRows.map((row) => (
              <TableRow key={row}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
