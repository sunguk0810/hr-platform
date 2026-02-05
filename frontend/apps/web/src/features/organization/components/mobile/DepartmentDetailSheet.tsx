import { User, Users, Building2, Hash, Globe } from 'lucide-react';
import { BottomSheet } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Department } from '@hr-platform/shared-types';

interface DepartmentDetailSheetProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  onViewEmployees?: () => void;
}

export function DepartmentDetailSheet({
  open,
  onClose,
  department,
  onViewEmployees,
}: DepartmentDetailSheetProps) {
  if (!department) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="부서 정보">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{department.name}</h2>
            {department.nameEn && (
              <p className="text-sm text-muted-foreground">{department.nameEn}</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Hash className="h-4 w-4" />
              <span className="text-xs">부서코드</span>
            </div>
            <p className="text-sm font-mono">{department.code}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">조직레벨</span>
            </div>
            <p className="text-sm">{department.level}단계</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">상위부서</span>
            </div>
            <p className="text-sm">{department.parentName || '(최상위)'}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-xs">상태</span>
            </div>
            <StatusBadge
              status={department.status === 'ACTIVE' ? 'success' : 'default'}
              label={department.status === 'ACTIVE' ? '활성' : '비활성'}
            />
          </div>
        </div>

        {/* Manager */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            <span className="text-sm">부서장</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {department.managerName || '미지정'}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Count */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">소속 인원</span>
          </div>
          <span className="text-xl font-bold text-primary">
            {department.employeeCount}명
          </span>
        </div>

        {/* Actions */}
        {onViewEmployees && (
          <Button className="w-full" onClick={onViewEmployees}>
            <Users className="mr-2 h-4 w-4" />
            소속 직원 보기
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
