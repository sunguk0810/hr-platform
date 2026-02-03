import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { DataTableExportProps } from './types';

export function DataTableExport<TData>({
  data,
  columns,
  fileName = 'export',
}: DataTableExportProps<TData>) {
  const prepareData = useCallback(() => {
    return data.map((row) => {
      const rowData: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = (row as Record<string, unknown>)[col.accessorKey];
        rowData[col.header] = value ?? '';
      });
      return rowData;
    });
  }, [data, columns]);

  const exportToExcel = useCallback(() => {
    const exportData = prepareData();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const colWidths = columns.map((col) => ({
      wch: Math.max(
        col.header.length,
        ...exportData.map((row) => String(row[col.header] || '').length)
      ),
    }));
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${fileName}_${formatDate()}.xlsx`);
  }, [prepareData, columns, fileName]);

  const exportToCsv = useCallback(() => {
    const exportData = prepareData();
    const headers = columns.map((col) => col.header).join(',');
    const rows = exportData.map((row) =>
      columns
        .map((col) => {
          const value = row[col.header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}_${formatDate()}.csv`);
  }, [prepareData, columns, fileName]);

  if (data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-4 w-4 mr-2" />
          내보내기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCsv}>CSV (.csv)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
