import { TableCell, TableRow } from '@workspace/ui/components/table'

/** Displays the empty state inside an assets table. */
export function AssetsTableEmpty() {
  return (
    <TableRow>
      <TableCell className="h-28 text-center text-muted-foreground" colSpan={5}>
        No assets to show
      </TableCell>
    </TableRow>
  )
}
