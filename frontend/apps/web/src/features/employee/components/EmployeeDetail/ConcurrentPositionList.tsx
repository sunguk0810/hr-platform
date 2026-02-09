import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('employee');
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
        title: t('toast.primaryChangeComplete'),
        description: t('concurrentPosition.setPrimarySuccess', { name: position.departmentName }),
      });
    } catch {
      toast({
        title: t('toast.primaryChangeFailure'),
        description: t('concurrentPosition.setPrimaryFailure'),
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
          reason: t('concurrentPosition.menuEndPosition'),
        },
      });
      toast({
        title: t('toast.endComplete'),
        description: t('concurrentPosition.endSuccess', { name: endingPosition.departmentName }),
      });
      setEndingPosition(null);
    } catch {
      toast({
        title: t('toast.endFailure'),
        description: t('concurrentPosition.endFailure'),
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
        title: t('toast.deleteComplete'),
        description: t('concurrentPosition.deleteSuccess', { name: deletingPosition.departmentName }),
      });
      setDeletingPosition(null);
    } catch {
      toast({
        title: t('toast.deleteFailure'),
        description: t('concurrentPosition.deleteFailure'),
        variant: 'destructive',
      });
    }
  };

  const renderPositionTable = (data: ConcurrentPosition[], title: string, showActions = true) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t('concurrentPosition.emptyPositions')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('concurrentPosition.tableType')}</TableHead>
              <TableHead>{t('concurrentPosition.tableDepartment')}</TableHead>
              <TableHead>{t('concurrentPosition.tablePosition')}</TableHead>
              <TableHead>{t('concurrentPosition.tableGrade')}</TableHead>
              <TableHead>{t('concurrentPosition.tableStartDate')}</TableHead>
              <TableHead>{t('concurrentPosition.tableEndDate')}</TableHead>
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
                        {t('concurrentPosition.primaryBadge')}
                      </>
                    ) : (
                      t('concurrentPosition.secondaryBadge')
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
                          {t('concurrentPosition.menuEdit')}
                        </DropdownMenuItem>
                        {!position.isPrimary && position.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(position)}>
                            <Star className="mr-2 h-4 w-4" />
                            {t('concurrentPosition.menuSetPrimary')}
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
                              {t('concurrentPosition.menuEndPosition')}
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
                              {t('concurrentPosition.menuDelete')}
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
            {t('concurrentPosition.title')}
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
            {t('concurrentPosition.title')}
            <Badge variant="outline" className="ml-2">
              {t('concurrentPosition.activeCount', { count: activePositions.length })}
            </Badge>
          </CardTitle>
          {editable && (
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('concurrentPosition.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {positions.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t('concurrentPosition.emptyTitle')}
              description={t('concurrentPosition.emptyDescription')}
              action={
                editable ? {
                  label: t('concurrentPosition.addPositionButton'),
                  onClick: () => setIsAddDialogOpen(true)
                } : undefined
              }
            />
          ) : (
            <>
              {renderPositionTable(activePositions, t('concurrentPosition.currentPositions'), true)}
              {endedPositions.length > 0 && (
                <>
                  <div className="border-t" />
                  {renderPositionTable(endedPositions, t('concurrentPosition.endedPositions'), false)}
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
        title={t('concurrentPosition.endPositionTitle')}
        description={t('concurrentPosition.endPositionDescription', { name: endingPosition?.departmentName })}
        confirmLabel={t('concurrentPosition.menuEndPosition')}
        variant="default"
        onConfirm={handleEndPosition}
        isLoading={endPositionMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingPosition}
        onOpenChange={(open) => !open && setDeletingPosition(null)}
        title={t('concurrentPosition.deletePositionTitle')}
        description={t('concurrentPosition.deletePositionDescription', { name: deletingPosition?.departmentName })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={handleDeletePosition}
        isLoading={deletePositionMutation.isPending}
      />
    </>
  );
}

export default ConcurrentPositionList;
