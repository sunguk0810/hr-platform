import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Plus,
  MoreHorizontal,
  Building2,
  Star,
  Edit,
  XCircle,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useConcurrentPositions,
  useEndConcurrentPosition,
  useDeleteConcurrentPosition,
  useSetPrimaryPosition,
} from '../../hooks/useEmployees';
import type { ConcurrentPosition } from '@hr-platform/shared-types';
import { ConcurrentPositionDialog } from './ConcurrentPositionDialog';

interface ConcurrentPositionListProps {
  employeeId: string;
  employeeName?: string;
  editable?: boolean;
}

export function ConcurrentPositionList({
  employeeId,
  employeeName,
  editable = false,
}: ConcurrentPositionListProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ConcurrentPosition | null>(null);
  const [endingPosition, setEndingPosition] = useState<ConcurrentPosition | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<ConcurrentPosition | null>(null);

  const { data: positionsData, isLoading } = useConcurrentPositions(employeeId);
  const endPositionMutation = useEndConcurrentPosition();
  const deletePositionMutation = useDeleteConcurrentPosition();
  const setPrimaryMutation = useSetPrimaryPosition();

  const positions = positionsData?.data ?? [];
  const activePositions = positions.filter((p) => p.status === 'ACTIVE');
  const endedPositions = positions.filter((p) => p.status === 'ENDED');

  const handleSetPrimary = async (position: ConcurrentPosition) => {
    try {
      await setPrimaryMutation.mutateAsync({
        employeeId,
        positionId: position.id,
      });
      toast({
        title: '주소속 변경 완료',
        description: `${position.departmentName}을(를) 주소속으로 설정했습니다.`,
      });
    } catch {
      toast({
        title: '주소속 변경 실패',
        description: '주소속 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEndPosition = async () => {
    if (!endingPosition) return;

    try {
      await endPositionMutation.mutateAsync({
        employeeId,
        positionId: endingPosition.id,
        data: {
          endDate: format(new Date(), 'yyyy-MM-dd'),
          reason: '겸직 종료',
        },
      });
      toast({
        title: '겸직 종료 완료',
        description: `${endingPosition.departmentName} 겸직이 종료되었습니다.`,
      });
      setEndingPosition(null);
    } catch {
      toast({
        title: '겸직 종료 실패',
        description: '겸직 종료 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePosition = async () => {
    if (!deletingPosition) return;

    try {
      await deletePositionMutation.mutateAsync({
        employeeId,
        positionId: deletingPosition.id,
      });
      toast({
        title: '삭제 완료',
        description: `${deletingPosition.departmentName} 소속 정보가 삭제되었습니다.`,
      });
      setDeletingPosition(null);
    } catch {
      toast({
        title: '삭제 실패',
        description: '소속 정보 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const renderPositionTable = (data: ConcurrentPosition[], title: string, showActions = true) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          해당하는 소속 정보가 없습니다.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">구분</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직위</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>종료일</TableHead>
              {showActions && editable && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((position) => (
              <TableRow key={position.id}>
                <TableCell>
                  <Badge variant={position.isPrimary ? 'default' : 'secondary'}>
                    {position.isPrimary ? (
                      <>
                        <Star className="mr-1 h-3 w-3" />
                        주소속
                      </>
                    ) : (
                      '부소속'
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{position.departmentName}</TableCell>
                <TableCell>{position.positionName || '-'}</TableCell>
                <TableCell>{position.gradeName || '-'}</TableCell>
                <TableCell>
                  {format(new Date(position.startDate), 'yyyy.MM.dd', { locale: ko })}
                </TableCell>
                <TableCell>
                  {position.endDate
                    ? format(new Date(position.endDate), 'yyyy.MM.dd', { locale: ko })
                    : '-'}
                </TableCell>
                {showActions && editable && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingPosition(position)}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        {!position.isPrimary && position.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(position)}>
                            <Star className="mr-2 h-4 w-4" />
                            주소속으로 설정
                          </DropdownMenuItem>
                        )}
                        {position.status === 'ACTIVE' && !position.isPrimary && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setEndingPosition(position)}
                              className="text-amber-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              겸직 종료
                            </DropdownMenuItem>
                          </>
                        )}
                        {!position.isPrimary && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingPosition(position)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            소속 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            소속 정보
            <Badge variant="outline" className="ml-2">
              {activePositions.length}개 활성
            </Badge>
          </CardTitle>
          {editable && (
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              겸직 추가
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {positions.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="소속 정보 없음"
              description="등록된 소속 정보가 없습니다."
              action={
                editable ? {
                  label: '소속 추가',
                  onClick: () => setIsAddDialogOpen(true)
                } : undefined
              }
            />
          ) : (
            <>
              {renderPositionTable(activePositions, '현재 소속', true)}
              {endedPositions.length > 0 && (
                <>
                  <div className="border-t" />
                  {renderPositionTable(endedPositions, '종료된 소속', false)}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ConcurrentPositionDialog
        open={isAddDialogOpen || !!editingPosition}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingPosition(null);
          }
        }}
        employeeId={employeeId}
        employeeName={employeeName}
        position={editingPosition}
        existingPositions={positions}
      />

      {/* End Confirmation Dialog */}
      <ConfirmDialog
        open={!!endingPosition}
        onOpenChange={(open) => !open && setEndingPosition(null)}
        title="겸직 종료"
        description={`${endingPosition?.departmentName} 겸직을 종료하시겠습니까? 종료일은 오늘 날짜로 설정됩니다.`}
        confirmLabel="종료"
        variant="default"
        onConfirm={handleEndPosition}
        isLoading={endPositionMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingPosition}
        onOpenChange={(open) => !open && setDeletingPosition(null)}
        title="소속 정보 삭제"
        description={`${deletingPosition?.departmentName} 소속 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDeletePosition}
        isLoading={deletePositionMutation.isPending}
      />
    </>
  );
}

export default ConcurrentPositionList;
