import {
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'

export type DataTableColumnMeta = {
  align?: 'end' | 'start'
}

/** Feature set shared by app data tables: column sorting plus cell alignment. */
export const dataTableFeatures = tableFeatures({
  columnMeta: {} as DataTableColumnMeta,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

export type DataTableFeatures = typeof dataTableFeatures
