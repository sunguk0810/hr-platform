import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataTable } from './DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
}

const mockEmployees: Employee[] = [
  { id: '1', name: '홍길동', email: 'hong@example.com', department: '개발팀', position: '팀장', status: 'ACTIVE' },
  { id: '2', name: '김철수', email: 'kim@example.com', department: '개발팀', position: '선임', status: 'ACTIVE' },
  { id: '3', name: '이영희', email: 'lee@example.com', department: '인사팀', position: '매니저', status: 'ACTIVE' },
  { id: '4', name: '박지민', email: 'park@example.com', department: '재무팀', position: '주임', status: 'ON_LEAVE' },
  { id: '5', name: '최수진', email: 'choi@example.com', department: '마케팅팀', position: '팀장', status: 'ACTIVE' },
  { id: '6', name: '정민호', email: 'jung@example.com', department: '개발팀', position: '책임', status: 'ACTIVE' },
  { id: '7', name: '강하늘', email: 'kang@example.com', department: '디자인팀', position: '선임', status: 'ACTIVE' },
  { id: '8', name: '윤서연', email: 'yoon@example.com', department: '인사팀', position: '주임', status: 'RESIGNED' },
  { id: '9', name: '임준혁', email: 'lim@example.com', department: '영업팀', position: '팀장', status: 'ACTIVE' },
  { id: '10', name: '한예진', email: 'han@example.com', department: '개발팀', position: '사원', status: 'ACTIVE' },
];

const columns: ColumnDef<Employee, string>[] = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'department', header: '부서' },
  { accessorKey: 'position', header: '직책' },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const statusMap: Record<string, { label: string; className: string }> = {
        ACTIVE: { label: '재직', className: 'bg-green-100 text-green-800' },
        ON_LEAVE: { label: '휴직', className: 'bg-yellow-100 text-yellow-800' },
        RESIGNED: { label: '퇴직', className: 'bg-gray-100 text-gray-800' },
      };
      const { label, className } = statusMap[status] || statusMap.ACTIVE;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
          {label}
        </span>
      );
    },
  },
];

const meta: Meta<typeof DataTable<Employee, string>> = {
  title: 'Common/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable<Employee, string>>;

export const Default: Story = {
  args: {
    columns,
    data: mockEmployees,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyMessage: '직원 데이터가 없습니다.',
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
  },
};

export const WithRowSelection: Story = {
  args: {
    columns,
    data: mockEmployees,
    enableRowSelection: true,
  },
};

export const WithExport: Story = {
  args: {
    columns,
    data: mockEmployees,
    enableExport: true,
    exportFileName: 'employees',
  },
};

export const WithToolbarActions: Story = {
  args: {
    columns,
    data: mockEmployees,
    toolbarActions: (
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        직원 추가
      </Button>
    ),
  },
};

export const WithRowClick: Story = {
  args: {
    columns,
    data: mockEmployees,
    onRowClick: (row) => {
      alert(`Clicked: ${row.name}`);
    },
  },
};

// Interactive with pagination
export const WithPagination: StoryObj = {
  render: function WithPagination() {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

    const paginatedData = mockEmployees.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize
    );

    return (
      <DataTable
        columns={columns}
        data={paginatedData}
        pagination={pagination}
        pageCount={Math.ceil(mockEmployees.length / pagination.pageSize)}
        onPaginationChange={setPagination}
      />
    );
  },
};

// Interactive with sorting
export const WithSorting: StoryObj = {
  render: function WithSorting() {
    const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

    const sortedData = [...mockEmployees].sort((a, b) => {
      if (sorting.length === 0) return 0;
      const { id, desc } = sorting[0];
      const aVal = a[id as keyof Employee];
      const bVal = b[id as keyof Employee];
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });

    return (
      <DataTable
        columns={columns}
        data={sortedData}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    );
  },
};

// Interactive with global filter
export const WithGlobalFilter: StoryObj = {
  render: function WithGlobalFilter() {
    const [globalFilter, setGlobalFilter] = useState('');

    const filteredData = mockEmployees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        employee.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        employee.department.toLowerCase().includes(globalFilter.toLowerCase())
    );

    return (
      <DataTable
        columns={columns}
        data={filteredData}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />
    );
  },
};

// Full featured example
export const FullFeatured: StoryObj = {
  render: function FullFeatured() {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
    const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    // Filter
    let data = mockEmployees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        employee.email.toLowerCase().includes(globalFilter.toLowerCase())
    );

    // Sort
    if (sorting.length > 0) {
      data = [...data].sort((a, b) => {
        const { id, desc } = sorting[0];
        const aVal = a[id as keyof Employee];
        const bVal = b[id as keyof Employee];
        if (aVal < bVal) return desc ? 1 : -1;
        if (aVal > bVal) return desc ? -1 : 1;
        return 0;
      });
    }

    // Paginate
    const pageCount = Math.ceil(data.length / pagination.pageSize);
    const paginatedData = data.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize
    );

    return (
      <DataTable
        columns={columns}
        data={paginatedData}
        pagination={pagination}
        pageCount={pageCount}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableExport
        exportFileName="employees"
        toolbarActions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            직원 추가
          </Button>
        }
        onRowClick={(row) => console.log('Clicked:', row)}
      />
    );
  },
};
