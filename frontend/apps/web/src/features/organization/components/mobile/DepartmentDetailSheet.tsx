import { useTranslation } from 'react-i18next';
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

  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');

  return (
    <BottomSheet open={open} onClose={onClose} title={t('department.info')}>
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
              <span className="text-xs">{t('department.code')}</span>
            </div>
            <p className="text-sm font-mono">{department.code}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">{t('department.orgLevel')}</span>
            </div>
            <p className="text-sm">{t('department.orgLevelValue', { level: department.level })}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">{t('department.parentDepartment')}</span>
            </div>
            <p className="text-sm">{department.parentName || t('department.topLevel')}</p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-xs">{tCommon('status')}</span>
            </div>
            <StatusBadge
              status={department.status === 'ACTIVE' ? 'success' : 'default'}
              label={department.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
            />
          </div>
        </div>

        {/* Manager */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{t('department.head')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {department.managerName || t('department.headNotAssigned')}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Count */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">{t('department.members')}</span>
          </div>
          <span className="text-xl font-bold text-primary">
            {department.employeeCount}{tCommon('unit.person')}
          </span>
        </div>

        {/* Actions */}
        {onViewEmployees && (
          <Button className="w-full" onClick={onViewEmployees}>
            <Users className="mr-2 h-4 w-4" />
            {t('department.viewEmployees')}
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
