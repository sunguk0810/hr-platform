import { useState, useMemo, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableExport } from './DataTableExport';
import { DataTableSkeleton } from './DataTableSkeleton';
import { EmptyState } from '../EmptyState';
import type { DataTableProps } from './types';

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageCount: controlledPageCount,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  enableExport = false,
  exportFileName = 'export',
  enableMobileCard = false,
  mobileCardRenderer,
  toolbarActions,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  getRowId,
}: DataTableProps<TData, TValue>) {
  // Internal states for uncontrolled mode
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = useState<Record<string, boolean>>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('');

  // Determine controlled vs uncontrolled
  const sorting = controlledSorting ?? internalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility;
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      if (onSortingChange) {
        onSortingChange(newSorting);
      } else {
        setInternalSorting(newSorting);
      }
    },
    [sorting, onSortingChange]
  );

  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      if (onColumnFiltersChange) {
        onColumnFiltersChange(newFilters);
      } else {
        setInternalColumnFilters(newFilters);
      }
    },
    [columnFilters, onColumnFiltersChange]
  );

  const handleColumnVisibilityChange = useCallback(
    (updater: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(newVisibility);
      } else {
        setInternalColumnVisibility(newVisibility);
      }
    },
    [columnVisibility, onColumnVisibilityChange]
  );

  const handleRowSelectionChange = useCallback(
    (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelection);
      } else {
        setInternalRowSelection(newSelection);
      }
    },
    [rowSelection, onRowSelectionChange]
  );

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      if (onGlobalFilterChange) {
        onGlobalFilterChange(value);
      } else {
        setInternalGlobalFilter(value);
      }
    },
    [onGlobalFilterChange]
  );

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    if (!enableRowSelection) return columns;

    return [
      {
        id: 'select',
        header: ({ table }: { table: ReturnType<typeof useReactTable<TData>> }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value)}
            aria-label="전체 선택"
          />
        ),
        cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
            aria-label="행 선택"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      ...columns,
    ];
  }, [columns, enableRowSelection]);

  const isServerSide = !!onPaginationChange && !!controlledPagination;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServerSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: handleRowSelectionChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      ...(isServerSide && controlledPagination
        ? { pagination: controlledPagination }
        : {}),
    },
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
    pageCount: controlledPageCount ?? -1,
    getRowId,
  });

  const columnToggleOptions = useMemo(() => {
    return columns
      .filter((col) => 'accessorKey' in col || 'id' in col)
      .map((col) => ({
        id: ('accessorKey' in col ? String(col.accessorKey) : col.id) || '',
        label:
          typeof col.header === 'string'
            ? col.header
            : ('accessorKey' in col ? String(col.accessorKey) : col.id) || '',
      }));
  }, [columns]);

  const exportColumns = useMemo(() => {
    return columns
      .filter((col) => 'accessorKey' in col)
      .map((col) => ({
        header: typeof col.header === 'string' ? col.header : String(col.accessorKey),
        accessorKey: String(col.accessorKey),
      }));
  }, [columns]);

  const pagination = controlledPagination ?? {
    pageIndex: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
  };

  const pageCount = controlledPageCount ?? table.getPageCount();

  const handlePageChange = useCallback(
    (pageIndex: number) => {
      if (onPaginationChange) {
        onPaginationChange({ ...pagination, pageIndex });
      } else {
        table.setPageIndex(pageIndex);
      }
    },
    [onPaginationChange, pagination, table]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      if (onPaginationChange) {
        onPaginationChange({ pageIndex: 0, pageSize });
      } else {
        table.setPageSize(pageSize);
      }
    },
    [onPaginationChange, table]
  );

  if (loading) {
    return (
      <DataTableSkeleton
        columns={columns.length + (enableRowSelection ? 1 : 0)}
        rows={pagination.pageSize}
      />
    );
  }

  // Mobile card view
  const showMobileCards = enableMobileCard && mobileCardRenderer;

  return (
    <div className="w-full">
      <DataTableToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={handleGlobalFilterChange}
        searchPlaceholder="검색..."
        enableColumnToggle
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        columns={columnToggleOptions}
        actions={
          <>
            {toolbarActions}
            {enableExport && (
              <DataTableExport
                data={data}
                columns={exportColumns}
                fileName={exportFileName}
              />
            )}
          </>
        }
      />

      {/* Desktop Table View */}
      <div className={cn('rounded-md border', showMobileCards && 'hidden md:block')}>
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  <EmptyState title={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {showMobileCards && (
        <div className="md:hidden space-y-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  'rounded-lg border p-4',
                  row.getIsSelected() && 'bg-muted',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {enableRowSelection && (
                  <div className="mb-2">
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
                      aria-label="행 선택"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  </div>
                )}
                {mobileCardRenderer(row.original)}
              </div>
            ))
          ) : (
            <EmptyState title={emptyMessage} />
          )}
        </div>
      )}

      <DataTablePagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        totalItems={isServerSide ? undefined : data.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
