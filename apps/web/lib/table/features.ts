import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'

export type DataTableColumnMeta = {
  align?: 'end' | 'start'
}

/** Feature set shared by app data tables: sorting, pagination, and cell alignment. */
export const dataTableFeatures = tableFeatures({
  columnMeta: {} as DataTableColumnMeta,
  paginatedRowModel: createPaginatedRowModel(),
  rowPaginationFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

export type DataTableFeatures = typeof dataTableFeatures
