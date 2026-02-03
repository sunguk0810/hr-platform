import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { DataTableFilter } from './DataTableFilter';
import type { DataTableToolbarProps } from './types';

export function DataTableToolbar({
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  enableColumnToggle,
  columnVisibility,
  onColumnVisibilityChange,
  columns,
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
      <div className="flex flex-1 items-center gap-2">
        {onGlobalFilterChange && (
          <DataTableFilter
            globalFilter={globalFilter || ''}
            onGlobalFilterChange={onGlobalFilterChange}
            placeholder={searchPlaceholder}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {enableColumnToggle && columns && onColumnVisibilityChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="h-4 w-4 mr-2" />
                열 표시
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>표시할 열 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility?.[column.id] !== false}
                  onCheckedChange={(checked) => {
                    onColumnVisibilityChange({
                      ...columnVisibility,
                      [column.id]: checked,
                    });
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
