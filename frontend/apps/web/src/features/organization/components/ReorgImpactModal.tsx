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

const changeTypeLabels: Record<ReorgChangeType, string> = {
  merge: '부서 통합',
  split: '부서 분리',
  rename: '부서 명칭 변경',
  delete: '부서 삭제',
};

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
      const response = await fetch(
        `/api/v1/organizations/departments/${sourceDepartment.id}/impact?changeType=${changeType}`
      );
      const json = await response.json();
      if (json.success) {
        setImpactData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch impact data:', error);
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
      (emp.position === '팀장' || emp.position === '부장') &&
      (emp.newDepartment === '-' || emp.newDepartment === '미정')
  ) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChangeIcon className="h-5 w-5 text-primary" />
            조직 변경 영향도 분석
          </DialogTitle>
          <DialogDescription>
            {changeTypeLabels[changeType]} 시 영향을 받는 직원 및 변경 사항을 확인합니다.
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
                <span className="text-sm font-medium">영향 직원 수</span>
              </div>
              <Badge variant={impactData.affectedCount > 0 ? 'destructive' : 'secondary'}>
                {impactData.affectedCount}명
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
                <AlertTitle>관리자 배치 미지정</AlertTitle>
                <AlertDescription>
                  다음 관리자의 변경 후 부서가 지정되지 않았습니다:{' '}
                  {unassignedManagers.map((m) => m.name).join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {changeType === 'delete' && impactData.affectedCount > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>부서 삭제 경고</AlertTitle>
                <AlertDescription>
                  이 부서에 소속된 {impactData.affectedCount}명의 직원이 있습니다.
                  삭제 전 모든 직원의 부서를 재배치해야 합니다.
                </AlertDescription>
              </Alert>
            )}

            {/* Affected employees table */}
            {impactData.employees.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">사번</TableHead>
                      <TableHead className="w-[90px]">이름</TableHead>
                      <TableHead>현재 부서</TableHead>
                      <TableHead>변경 후 부서</TableHead>
                      <TableHead className="w-[80px]">직급</TableHead>
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
                          {employee.newDepartment === '-' || employee.newDepartment === '미정' ? (
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
                영향을 받는 직원이 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            영향도 데이터를 불러올 수 없습니다.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isApplying || isLoading}
            variant={changeType === 'delete' ? 'destructive' : 'default'}
          >
            {isApplying ? '적용 중...' : '변경 적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
