import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Mail,
  Trash2,
  LayoutGrid,
  LayoutList,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { useEmployeeList, useEmployeeSearchParams } from '../hooks/useEmployees';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { employeeService } from '../services/employeeService';
import { EmployeeImportDialog } from '../components/EmployeeImportDialog';
import type { EmploymentStatus, EmployeeListItem } from '@hr-platform/shared-types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Excel export utility (simple CSV for now)
function exportToExcel(employees: EmployeeListItem[], filename: string) {
  const headers = ['사번', '이름', '이메일', '부서', '직급', '직책', '상태', '입사일'];
  const statusLabels: Record<EmploymentStatus, string> = {
    ACTIVE: '재직',
    ON_LEAVE: '휴직',
    RESIGNED: '퇴직',
    RETIRED: '정년퇴직',
  };

  const rows = employees.map((emp) => [
    emp.employeeNumber,
    emp.name,
    emp.email,
    emp.departmentName,
    emp.gradeName || '',
    emp.positionName || '',
    statusLabels[emp.employmentStatus],
    emp.hireDate,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface EmployeeCardProps {
  employee: EmployeeListItem;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: () => void;
}

function EmployeeCard({ employee, isSelected, onSelect, onClick }: EmployeeCardProps) {
  const getInitials = (name: string) => name.slice(0, 2);
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR');

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked: boolean | 'indeterminate') => onSelect(employee.id, checked as boolean)}
            />
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-medium truncate">{employee.name}</div>
              <EmploymentStatusBadge status={employee.employmentStatus} />
            </div>
            <div className="text-sm text-muted-foreground">{employee.employeeNumber}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {employee.departmentName} · {employee.positionName || '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              입사일: {formatDate(employee.hireDate)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'card'>(isMobile ? 'card' : 'table');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedKeyword = useDebounce(searchInput, 300);

  const {
    params,
    searchState,
    setKeyword,
    setEmploymentStatus,
    setPage,
  } = useEmployeeSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  useEffect(() => {
    if (isMobile) {
      setViewMode('card');
    }
  }, [isMobile]);

  const { data, isLoading, isError } = useEmployeeList(params);

  const employees = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/employees/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(employees.map((emp) => emp.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = employees.length > 0 && employees.every((emp) => selectedIds.has(emp.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleExport = () => {
    const dataToExport = isSomeSelected
      ? employees.filter((emp) => selectedIds.has(emp.id))
      : employees;
    const filename = `employees_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dataToExport, filename);
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleImportSuccess = () => {
    // Refetch employee list after successful import
    window.location.reload();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await employeeService.bulkDelete(Array.from(selectedIds));
      toast({
        title: '삭제 완료',
        description: `${response.data?.deleted || selectedIds.size}명의 직원 정보가 삭제되었습니다.`,
      });
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      // Refetch employee list
      window.location.reload();
    } catch {
      toast({
        title: '삭제 실패',
        description: '직원 정보 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAction = (action: 'email' | 'delete') => {
    const selectedEmployees = employees.filter((emp) => selectedIds.has(emp.id));
    if (action === 'email') {
      const emails = selectedEmployees.map((emp) => emp.email).join(',');
      window.location.href = `mailto:${emails}`;
    } else if (action === 'delete') {
      setDeleteDialogOpen(true);
    }
  };

  return (
    <>
      <PageHeader
        title="인사정보"
        description="임직원 정보를 조회하고 관리합니다."
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  엑셀
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  내보내기 {isSomeSelected && `(${selectedIds.size}명)`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  가져오기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate('/employees/new')}>
              <Plus className="mr-2 h-4 w-4" />
              신규 등록
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이름, 사번, 이메일로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={searchState.employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | '')}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">전체 상태</option>
                <option value="ACTIVE">재직</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="RESIGNED">퇴직</option>
                <option value="RETIRED">정년퇴직</option>
              </select>
              {!isMobile && (
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('card')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bulk actions */}
          {isSomeSelected && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size}명 선택됨
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  이메일 보내기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                선택 해제
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-4">
            <SkeletonTable rows={5} />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="데이터를 불러올 수 없습니다"
              description="잠시 후 다시 시도해주세요."
            />
          </CardContent>
        </Card>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="등록된 직원이 없습니다"
              description={
                searchState.keyword || searchState.employmentStatus
                  ? '검색 조건에 맞는 직원이 없습니다.'
                  : '신규 직원을 등록하거나 데이터를 가져와주세요.'
              }
              action={
                !searchState.keyword && !searchState.employmentStatus
                  ? {
                      label: '신규 등록',
                      onClick: () => navigate('/employees/new'),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                isSelected={selectedIds.has(employee.id)}
                onSelect={handleSelectOne}
                onClick={() => handleRowClick(employee.id)}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">총 {totalElements}명</div>
            <Pagination
              page={searchState.page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      직원
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      부서
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      직급
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      입사일
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">

                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(employee.id)}
                          onCheckedChange={(checked: boolean | 'indeterminate') =>
                            handleSelectOne(employee.id, checked as boolean)
                          }
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleRowClick(employee.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-sm cursor-pointer"
                        onClick={() => handleRowClick(employee.id)}
                      >
                        {employee.departmentName}
                      </td>
                      <td
                        className="px-4 py-3 text-sm cursor-pointer"
                        onClick={() => handleRowClick(employee.id)}
                      >
                        {employee.positionName || '-'}
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleRowClick(employee.id)}
                      >
                        <EmploymentStatusBadge status={employee.employmentStatus} />
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-muted-foreground cursor-pointer"
                        onClick={() => handleRowClick(employee.id)}
                      >
                        {formatDate(employee.hireDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRowClick(employee.id)}>
                              상세보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `mailto:${employee.email}`}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              이메일 보내기
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">총 {totalElements}명</div>
              <Pagination
                page={searchState.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleImportSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="직원 삭제"
        description={`선택한 ${selectedIds.size}명의 직원 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleBulkDelete}
      />
    </>
  );
}
