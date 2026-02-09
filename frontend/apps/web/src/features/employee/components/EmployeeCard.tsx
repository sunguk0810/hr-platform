import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import { Mail, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmployeeListItem } from '@hr-platform/shared-types';

export interface EmployeeCardProps {
  employee: EmployeeListItem;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: () => void;
  showCheckbox?: boolean;
  className?: string;
}

export function EmployeeCard({
  employee,
  isSelected = false,
  onSelect,
  onClick,
  showCheckbox = true,
  className,
}: EmployeeCardProps) {
  const { t } = useTranslation('employee');

  const getInitials = (name: string) => name.slice(0, 2);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR');

  return (
    <Card
      className={cn(
        'transition-colors hover:bg-muted/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showCheckbox && onSelect && (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  onSelect(employee.id, checked as boolean)
                }
              />
            </div>
          )}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
            <AvatarFallback className="text-sm font-medium">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{employee.name}</span>
                <span className="text-sm text-muted-foreground flex-shrink-0">
                  {employee.employeeNumber}
                </span>
              </div>
              <EmploymentStatusBadge status={employee.status} />
            </div>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {employee.departmentName}
                  {employee.positionName && ` · ${employee.positionName}`}
                </span>
              </div>

              {employee.gradeName && (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 flex-shrink-0 text-center text-xs">{t('employeeCard.gradeLabel')}</span>
                  <span className="truncate">{employee.gradeName}</span>
                </div>
              )}

              {employee.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{t('employeeCard.hireDateLabel', { date: formatDate(employee.hireDate) })}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
