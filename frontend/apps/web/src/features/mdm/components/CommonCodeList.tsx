import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Code,
  Pencil,
  Trash2,
  GripVertical,
  Info,
} from 'lucide-react';
import type { CommonCodeListItem } from '@hr-platform/shared-types';

export interface CommonCodeListProps {
  commonCodes: CommonCodeListItem[];
  isLoading?: boolean;
  isError?: boolean;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  showGroupColumn?: boolean;
  onPageChange?: (page: number) => void;
  onEdit?: (code: CommonCodeListItem) => void;
  onDelete?: (code: CommonCodeListItem) => void;
  onReorder?: (codeId: string, newOrder: number) => void;
  onEmptyAction?: () => void;
  emptyMessage?: string;
  className?: string;
}

export function CommonCodeList({
  commonCodes,
  isLoading = false,
  isError = false,
  page = 1,
  totalPages = 0,
  totalElements = 0,
  showGroupColumn = true,
  onPageChange,
  onEdit,
  onDelete,
  onReorder,
  onEmptyAction,
  emptyMessage,
  className,
}: CommonCodeListProps) {
  const { t } = useTranslation('mdm');
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, codeId: string) => {
    setDraggedItem(codeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, codeId: string) => {
    e.preventDefault();
    if (draggedItem !== codeId) {
      setDragOverItem(codeId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetCode: CommonCodeListItem) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetCode.id && onReorder) {
      onReorder(draggedItem, targetCode.sortOrder);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <SkeletonTable rows={5} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <EmptyState
            icon={Code}
            title={t('common.errorLoadData')}
            description={t('common.errorRetry')}
          />
        </CardContent>
      </Card>
    );
  }

  if (commonCodes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <EmptyState
            icon={Code}
            title={emptyMessage || t('commonCode.emptyTitle')}
            description={t('commonCode.emptyDescription')}
            action={
              onEmptyAction
                ? {
                    label: t('commonCode.addButton'),
                    onClick: onEmptyAction,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {onReorder && (
                  <th className="w-10 px-2 py-3 text-left text-sm font-medium text-muted-foreground">
                    <span className="sr-only">{t('commonCode.reorderSrOnly')}</span>
                  </th>
                )}
                {showGroupColumn && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t('commonCode.columns.codeGroup')}
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.code')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.codeName')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.englishName')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.sortOrder')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.status')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('commonCode.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {commonCodes.map((code) => (
                <tr
                  key={code.id}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50',
                    draggedItem === code.id && 'opacity-50',
                    dragOverItem === code.id && 'bg-primary/10'
                  )}
                  draggable={!!onReorder}
                  onDragStart={(e) => handleDragStart(e, code.id)}
                  onDragOver={(e) => handleDragOver(e, code.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, code)}
                  onDragEnd={handleDragEnd}
                >
                  {onReorder && (
                    <td className="w-10 px-2 py-3">
                      <button
                        type="button"
                        className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                        title={t('commonCode.dragToReorder')}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                  {showGroupColumn && (
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {code.groupCode}
                      </Badge>
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                  <td className="px-4 py-3 text-sm font-medium">{code.codeName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {code.codeNameEn || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{code.sortOrder}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={code.active ? 'success' : 'default'}
                      label={code.active ? t('common.statusActive') : t('common.statusInactive')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(code)}
                        title={t('common.editButton')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(code)}
                        title={t('common.deleteButton')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => onPageChange?.(newPage)}
          />
        )}

        <div className="px-4 pb-3 text-sm text-muted-foreground">
          {t('common.totalCount', { count: totalElements })}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact list view for sidebars or inline usage
export interface CommonCodeCompactListProps {
  codes: CommonCodeListItem[];
  selectedCode?: string;
  onSelect?: (code: CommonCodeListItem) => void;
  className?: string;
}

export function CommonCodeCompactList({
  codes,
  selectedCode,
  onSelect,
  className,
}: CommonCodeCompactListProps) {
  const { t } = useTranslation('mdm');

  if (codes.length === 0) {
    return (
      <div className={cn('text-center py-4 text-sm text-muted-foreground', className)}>
        {t('commonCode.emptyCompactList')}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-1', className)}>
        {codes.map((code) => (
          <button
            key={code.id}
            type="button"
            onClick={() => onSelect?.(code)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm',
              'transition-colors hover:bg-muted',
              selectedCode === code.id && 'bg-primary/10 text-primary',
              !code.active && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-muted-foreground">
                {code.code}
              </span>
              <span className="truncate">{code.codeName}</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {!code.active && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {t('common.statusInactive')}
                </Badge>
              )}
              {code.codeNameEn && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{code.codeNameEn}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </button>
        ))}
      </div>
    </TooltipProvider>
  );
}
