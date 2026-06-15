import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { useState, useMemo, useId } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
  enableSelection?: boolean
  enableSorting?: boolean
  enableSearch?: boolean
  searchPlaceholder?: string
  searchColumn?: string
  pageSize?: number
  emptyState?: React.ReactNode
  loading?: boolean
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  enableSelection = false,
  enableSorting = true,
  enableSearch = true,
  searchPlaceholder = 'Search…',
  searchColumn,
  pageSize = 20,
  emptyState,
  loading = false,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const tableId = useId()

  const tableData = useMemo(() => (loading ? Array(pageSize).fill({}) as T[] : data), [data, loading, pageSize])

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!loading) return columns
    return columns.map((col) => ({
      ...col,
      cell: () => <div className="h-4 shimmer-bg rounded" style={{ width: `${60 + Math.random() * 80}px` }} />,
    }))
  }, [columns, loading])

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enableSelection,
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize } },
  })

  const hasData = data.length > 0 && !loading
  const pageCount = table.getPageCount()

  return (
    <div className={cn('space-y-3', className)}>
      {enableSearch && (
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-exia-text-muted" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-exia-border/50 bg-exia-card py-2 pl-9 pr-4 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-exia-text-muted hover:text-exia-text-secondary transition-colors text-xs"
            >
              &times;
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-exia-border/60 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-exia-border/40 bg-exia-elevated">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted',
                        enableSorting && header.column.getCanSort() && 'cursor-pointer select-none hover:text-exia-text-secondary transition-colors',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getIsSorted() && (
                          <span className="text-exia-cyan">
                            {header.column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-exia-border/20 bg-exia-card">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    {emptyState || (
                      <div className="flex flex-col items-center gap-2 text-exia-text-muted">
                        <Search size={20} className="opacity-50" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'table-row-hover transition-all duration-150',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-exia-text-secondary">
          <div className="flex items-center gap-2">
            <span className="text-exia-text-muted">
              Page {table.getState().pagination.pageIndex + 1} of {pageCount}
            </span>
            <span className="text-exia-text-muted">({data.length} total)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="flex h-7 w-7 items-center justify-center rounded border border-exia-border/40 bg-exia-elevated text-exia-text-muted disabled:opacity-30 hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <ChevronsLeft size={12} />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-7 w-7 items-center justify-center rounded border border-exia-border/40 bg-exia-elevated text-exia-text-muted disabled:opacity-30 hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            {table.getPageOptions().map((page) => {
              const current = table.getState().pagination.pageIndex
              if (Math.abs(current - page) > 2 && page !== 0 && page !== pageCount - 1) return null
              if (page === current) {
                return (
                  <button
                    key={page}
                    className="flex h-7 w-7 items-center justify-center rounded border border-exia-cyan/30 bg-exia-cyan/10 text-exia-cyan text-[11px] font-semibold"
                  >
                    {page + 1}
                  </button>
                )
              }
              return (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page)}
                  className="flex h-7 w-7 items-center justify-center rounded border border-exia-border/40 bg-exia-elevated text-exia-text-muted hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors text-[11px]"
                >
                  {page + 1}
                </button>
              )
            })}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-7 w-7 items-center justify-center rounded border border-exia-border/40 bg-exia-elevated text-exia-text-muted disabled:opacity-30 hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <ChevronRight size={12} />
            </button>
            <button
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className="flex h-7 w-7 items-center justify-center rounded border border-exia-border/40 bg-exia-elevated text-exia-text-muted disabled:opacity-30 hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <ChevronsRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
