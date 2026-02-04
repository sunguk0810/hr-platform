import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import type { Employee } from '@hr-platform/shared-types';

interface RecordCardHeaderProps {
  employee: Employee;
}

export function RecordCardHeader({ employee }: RecordCardHeaderProps) {
  const getInitials = (name: string) => name.slice(0, 2);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="flex items-start gap-6 p-6 bg-muted/30 rounded-lg">
      <Avatar className="h-24 w-24">
        <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
        <AvatarFallback className="text-2xl">{getInitials(employee.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">성명</p>
          <p className="font-semibold text-lg">{employee.name}</p>
          {employee.nameEn && (
            <p className="text-sm text-muted-foreground">{employee.nameEn}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">사번</p>
          <p className="font-medium">{employee.employeeNumber}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">부서</p>
          <p className="font-medium">{employee.departmentName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">직급/직책</p>
          <p className="font-medium">
            {employee.gradeName || '-'}
            {employee.positionName && ` / ${employee.positionName}`}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">입사일</p>
          <p className="font-medium">{formatDate(employee.hireDate)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">재직상태</p>
          <EmploymentStatusBadge status={employee.employmentStatus} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">이메일</p>
          <p className="font-medium text-sm">{employee.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">연락처</p>
          <p className="font-medium">{employee.mobile || '-'}</p>
        </div>
      </div>
    </div>
  );
}
