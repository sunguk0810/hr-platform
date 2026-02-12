import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, GitMerge, GitBranch, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showErrorToast } from '@/components/common/Error/ErrorToast';
import { apiClient } from '@/lib/apiClient';

/**
 * Position titles that indicate a manager role.
 * These values match the position names returned by the server API
 * (GET /api/v1/organizations/departments/:id/impact).
 * If server-side position naming changes, update these values accordingly.
 */
const MANAGER_POSITIONS = ['팀장', '부장'] as const;

/**
 * Values indicating an unassigned department after reorganization.
 * '-' is the default placeholder; '미정' means "undetermined" in server responses.
 * These are matched against AffectedEmployee.newDepartment from the impact API.
 */
const UNASSIGNED_DEPT_VALUES = ['-', '미정'] as const;

export type ReorgChangeType = 'merge' | 'split' | 'rename' | 'delete';

interface AffectedEmployee {
  id: string;
  name: string;
  employeeNumber: string;
  currentDepartment: string;
  newDepartment: string;
  position: string;
}

interface ReorgImpactData {
  affectedCount: number;
  employees: AffectedEmployee[];
}

interface ReorgImpactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeType: ReorgChangeType;
  sourceDepartment: { id: string; name: string };
  targetDepartment?: { id: string; name: string };
  onConfirm?: () => void;
}

const changeTypeIcons: Record<ReorgChangeType, typeof GitMerge> = {
  merge: GitMerge,
  split: GitBranch,
  rename: Pencil,
  delete: Trash2,
};

export function ReorgImpactModal({
  open,
  onOpenChange,
  changeType,
  sourceDepartment,
  targetDepartment,
  onConfirm,
}: ReorgImpactModalProps) {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');

  const changeTypeLabels: Record<ReorgChangeType, string> = {
    merge: t('reorg.changeType.merge'),
    split: t('reorg.changeType.split'),
    rename: t('reorg.changeType.rename'),
    delete: t('reorg.changeType.delete'),
  };

  const [impactData, setImpactData] = useState<ReorgImpactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (open && sourceDepartment.id) {
      fetchImpactData();
    }
  }, [open, sourceDepartment.id, changeType]);

  const fetchImpactData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/departments/reorg/impact', {
        title: `${changeType}:${sourceDepartment.name}`,
        changes: [
          {
            departmentId: sourceDepartment.id,
            action: changeType.toUpperCase(),
            targetDepartmentId: targetDepartment?.id,
            newName: targetDepartment?.name,
          },
        ],
      });
      const json = response.data;
      if (json.success && json.data) {
        setImpactData({
          affectedCount: json.data.affectedEmployeeCount ?? 0,
          employees: [],
        });
      }
    } catch (error) {
      showErrorToast(error, { title: t('reorg.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsApplying(true);
    try {
      onConfirm?.();
    } finally {
      setIsApplying(false);
      onOpenChange(false);
    }
  };

  const ChangeIcon = changeTypeIcons[changeType];

  // Detect warning cases: managers with no new assignment
  const unassignedManagers = impactData?.employees.filter(
    (emp) =>
      (MANAGER_POSITIONS as readonly string[]).includes(emp.position) &&
      (UNASSIGNED_DEPT_VALUES as readonly string[]).includes(emp.newDepartment)
  ) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChangeIcon className="h-5 w-5 text-primary" />
            {t('reorg.title')}
          </DialogTitle>
          <DialogDescription>
            {t('reorg.description', { changeType: changeTypeLabels[changeType] })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : impactData ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('reorg.affectedEmployees')}</span>
              </div>
              <Badge variant={impactData.affectedCount > 0 ? 'destructive' : 'secondary'}>
                {impactData.affectedCount}{tCommon('unit.person')}
              </Badge>
              <div className="ml-auto text-sm text-muted-foreground">
                {sourceDepartment.name}
                {targetDepartment && (
                  <>
                    {' → '}
                    {targetDepartment.name}
                  </>
                )}
              </div>
            </div>

            {/* Warning alerts */}
            {unassignedManagers.length > 0 && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('reorg.managerNotAssigned')}</AlertTitle>
                <AlertDescription>
                  {t('reorg.managerNotAssignedDesc')}{' '}
                  {unassignedManagers.map((m) => m.name).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {changeType === 'delete' && impactData.affectedCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('reorg.deletionWarning')}</AlertTitle>
                <AlertDescription>
                  {t('reorg.deletionWarningDesc', { count: impactData.affectedCount })}
                </AlertDescription>
              </Alert>
            )}

            {/* Affected employees table */}
            {impactData.employees.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">{t('reorg.tableHeaders.employeeNumber')}</TableHead>
                      <TableHead className="w-[90px]">{t('reorg.tableHeaders.name')}</TableHead>
                      <TableHead>{t('reorg.tableHeaders.currentDept')}</TableHead>
                      <TableHead>{t('reorg.tableHeaders.afterDept')}</TableHead>
                      <TableHead className="w-[80px]">{t('reorg.tableHeaders.grade')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {impactData.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-mono text-sm">
                          {employee.employeeNumber}
                        </TableCell>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.currentDepartment}</TableCell>
                        <TableCell>
                          {(UNASSIGNED_DEPT_VALUES as readonly string[]).includes(employee.newDepartment) ? (
                            <span className="text-destructive font-medium">
                              {employee.newDepartment}
                            </span>
                          ) : (
                            employee.newDepartment
                          )}
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {impactData.employees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('reorg.noAffected')}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('reorg.loadFailed')}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isApplying || isLoading}
            variant={changeType === 'delete' ? 'destructive' : 'default'}
          >
            {isApplying ? tCommon('applying') : t('reorg.applyChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
