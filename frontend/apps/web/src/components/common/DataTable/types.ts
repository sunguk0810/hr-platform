import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, PaginationState } from '@tanstack/react-table';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  // Server-side pagination
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Filtering
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  // Column visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  // Row selection
  enableRowSelection?: boolean;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  // Export
  enableExport?: boolean;
  exportFileName?: string;
  // Mobile
  enableMobileCard?: boolean;
  mobileCardRenderer?: (row: TData) => React.ReactNode;
  // Custom toolbar actions
  toolbarActions?: React.ReactNode;
  // Empty state
  emptyMessage?: string;
  // Row click handler
  onRowClick?: (row: TData) => void;
  // Row id accessor
  getRowId?: (row: TData) => string;
}

export interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems?: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface DataTableFilterProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  placeholder?: string;
}

export interface DataTableExportProps<TData> {
  data: TData[];
  columns: { header: string; accessorKey: string }[];
  fileName?: string;
}

export interface DataTableToolbarProps {
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  enableColumnToggle?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  columns?: { id: string; label: string }[];
  enableExport?: boolean;
  onExport?: () => void;
  actions?: React.ReactNode;
}
