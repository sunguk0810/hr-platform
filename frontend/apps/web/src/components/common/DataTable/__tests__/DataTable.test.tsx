import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface TestData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const mockData: TestData[] = [
  { id: '1', name: '홍길동', email: 'hong@example.com', status: 'active' },
  { id: '2', name: '김철수', email: 'kim@example.com', status: 'inactive' },
  { id: '3', name: '이영희', email: 'lee@example.com', status: 'active' },
];

const columns: ColumnDef<TestData, string>[] = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'status', header: '상태' },
];

describe('DataTable', () => {
  it('should render table with data', () => {
    render(<DataTable columns={columns} data={mockData} />);

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<DataTable columns={columns} data={mockData} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('이메일')).toBeInTheDocument();
    expect(screen.getByText('상태')).toBeInTheDocument();
  });

  it('should render empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
  });

  it('should render custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="검색 결과가 없습니다." />);

    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('should render loading skeleton when loading is true', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading />);

    // Skeleton renders animated placeholders
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle row click when onRowClick is provided', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={mockData} onRowClick={onRowClick} />);

    // Find and click the first data row
    const row = screen.getByText('홍길동').closest('tr');
    if (row) {
      fireEvent.click(row);
    }

    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should apply cursor-pointer class when onRowClick is provided', () => {
    render(<DataTable columns={columns} data={mockData} onRowClick={() => {}} />);

    const row = screen.getByText('홍길동').closest('tr');
    expect(row).toHaveClass('cursor-pointer');
  });

  describe('sorting', () => {
    it('should show sort indicators in sortable columns', () => {
      const { container } = render(<DataTable columns={columns} data={mockData} />);

      // Sort icons should be visible (ArrowUpDown by default)
      const sortButtons = container.querySelectorAll('button');
      expect(sortButtons.length).toBeGreaterThan(0);
    });

    it('should call onSortingChange when column header is clicked', () => {
      const onSortingChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={mockData}
          sorting={[]}
          onSortingChange={onSortingChange}
        />
      );

      // Click on a sortable column header
      const headerButton = screen.getByRole('button', { name: /이름/i });
      fireEvent.click(headerButton);

      expect(onSortingChange).toHaveBeenCalled();
    });
  });

  describe('row selection', () => {
    it('should render checkboxes when enableRowSelection is true', () => {
      render(<DataTable columns={columns} data={mockData} enableRowSelection />);

      // Should have header checkbox + row checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(mockData.length + 1); // header + rows
    });

    it('should not render checkboxes when enableRowSelection is false', () => {
      render(<DataTable columns={columns} data={mockData} enableRowSelection={false} />);

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('should call onRowSelectionChange when checkbox is clicked', () => {
      const onRowSelectionChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={mockData}
          enableRowSelection
          rowSelection={{}}
          onRowSelectionChange={onRowSelectionChange}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox');
      fireEvent.click(rowCheckboxes[1]); // Click first row checkbox

      expect(onRowSelectionChange).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      email: `user${i}@example.com`,
      status: 'active' as const,
    }));

    it('should render pagination controls', () => {
      render(
        <DataTable
          columns={columns}
          data={manyItems}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          pageCount={3}
          onPaginationChange={() => {}}
        />
      );

      // Should show page info
      expect(screen.getByText(/1 \/ 3 페이지/)).toBeInTheDocument();
    });

    it('should call onPaginationChange when page is changed', () => {
      const onPaginationChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={manyItems.slice(0, 10)}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          pageCount={3}
          onPaginationChange={onPaginationChange}
        />
      );

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /다음 페이지/i });
      fireEvent.click(nextButton);

      expect(onPaginationChange).toHaveBeenCalled();
    });
  });

  describe('global filter', () => {
    it('should render search input in toolbar', () => {
      render(<DataTable columns={columns} data={mockData} />);

      const searchInput = screen.getByPlaceholderText('검색...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should call onGlobalFilterChange when search input changes', () => {
      const onGlobalFilterChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={mockData}
          globalFilter=""
          onGlobalFilterChange={onGlobalFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('검색...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(onGlobalFilterChange).toHaveBeenCalledWith('test');
    });
  });

  describe('export functionality', () => {
    it('should render export button when enableExport is true', () => {
      render(<DataTable columns={columns} data={mockData} enableExport />);

      expect(screen.getByRole('button', { name: /내보내기/i })).toBeInTheDocument();
    });

    it('should not render export button when enableExport is false', () => {
      render(<DataTable columns={columns} data={mockData} enableExport={false} />);

      expect(screen.queryByRole('button', { name: /내보내기/i })).not.toBeInTheDocument();
    });
  });

  describe('custom row id', () => {
    it('should use getRowId when provided', () => {
      const getRowId = vi.fn((row: TestData) => row.id);
      render(<DataTable columns={columns} data={mockData} getRowId={getRowId} />);

      expect(getRowId).toHaveBeenCalled();
    });
  });

  describe('toolbar actions', () => {
    it('should render custom toolbar actions', () => {
      render(
        <DataTable
          columns={columns}
          data={mockData}
          toolbarActions={<button>Custom Action</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
    });
  });
});
