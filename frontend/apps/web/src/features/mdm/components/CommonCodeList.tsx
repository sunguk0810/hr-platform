import * as React from 'react';
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
  emptyMessage = '등록된 공통코드가 없습니다.',
  className,
}: CommonCodeListProps) {
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
            title="데이터를 불러올 수 없습니다"
            description="잠시 후 다시 시도해주세요."
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
            title={emptyMessage}
            description="새로운 공통코드를 추가해주세요."
            action={
              onEmptyAction
                ? {
                    label: '공통코드 추가',
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
                    <span className="sr-only">순서 변경</span>
                  </th>
                )}
                {showGroupColumn && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    코드그룹
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  코드
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  코드명
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  영문명
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  정렬순서
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  작업
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
                        title="드래그하여 순서 변경"
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
                  <td className="px-4 py-3 text-sm font-medium">{code.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {code.nameEn || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{code.sortOrder}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={code.isActive ? 'success' : 'default'}
                      label={code.isActive ? '활성' : '비활성'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(code)}
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(code)}
                        title="삭제"
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
          총 {totalElements}개
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
  if (codes.length === 0) {
    return (
      <div className={cn('text-center py-4 text-sm text-muted-foreground', className)}>
        코드가 없습니다.
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
              !code.isActive && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-muted-foreground">
                {code.code}
              </span>
              <span className="truncate">{code.name}</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {!code.isActive && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  비활성
                </Badge>
              )}
              {code.nameEn && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{code.nameEn}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </button>
        ))}
      </div>
    </TooltipProvider>
  );
}
