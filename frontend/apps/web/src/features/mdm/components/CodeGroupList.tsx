import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Database,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CodeGroupListItem } from '@hr-platform/shared-types';

export interface CodeGroupListProps {
  codeGroups: CodeGroupListItem[];
  isLoading?: boolean;
  isError?: boolean;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (group: CodeGroupListItem) => void;
  onDelete?: (group: CodeGroupListItem) => void;
  onViewCodes?: (group: CodeGroupListItem) => void;
  onEmptyAction?: () => void;
  emptyMessage?: string;
  className?: string;
}

export function CodeGroupList({
  codeGroups,
  isLoading = false,
  isError = false,
  page = 1,
  totalPages = 0,
  totalElements = 0,
  onPageChange,
  onEdit,
  onDelete,
  onViewCodes,
  onEmptyAction,
  emptyMessage,
  className,
}: CodeGroupListProps) {
  const { t } = useTranslation('mdm');

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
            icon={Database}
            title={t('common.errorLoadData')}
            description={t('common.errorRetry')}
          />
        </CardContent>
      </Card>
    );
  }

  if (codeGroups.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <EmptyState
            icon={Database}
            title={emptyMessage || t('codeGroup.emptyTitle')}
            description={t('codeGroup.emptyDescription')}
            action={
              onEmptyAction
                ? {
                    label: t('codeGroup.addButton'),
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
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.code')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.codeName')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.description')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.childCodes')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.type')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.status')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t('codeGroup.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {codeGroups.map((group) => (
                <tr
                  key={group.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-mono text-sm">{group.groupCode}</td>
                  <td className="px-4 py-3 text-sm font-medium">{group.groupName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                    {group.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-sm text-primary hover:text-primary/80"
                      onClick={() => onViewCodes?.(group)}
                    >
                      {t('codeGroup.childCodeCount', { count: group.codeCount })}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    {group.system ? (
                      <StatusBadge status="info" label={t('common.typeSystem')} />
                    ) : (
                      <StatusBadge status="default" label={t('common.typeUser')} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={group.active ? 'success' : 'default'}
                      label={group.active ? t('common.statusActive') : t('common.statusInactive')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(group)}
                        disabled={group.system}
                        title={group.system ? t('codeGroup.tooltipSystemEditDisabled') : t('codeGroup.tooltipEdit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(group)}
                        disabled={group.system}
                        title={group.system ? t('codeGroup.tooltipSystemDeleteDisabled') : t('codeGroup.tooltipDelete')}
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

// Compact card view for dashboard or sidebar
export interface CodeGroupCardProps {
  group: CodeGroupListItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewCodes?: () => void;
  className?: string;
}

export function CodeGroupCard({
  group,
  onEdit,
  onDelete,
  onViewCodes,
  className,
}: CodeGroupCardProps) {
  const { t } = useTranslation('mdm');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{group.groupName}</CardTitle>
            <p className="text-xs font-mono text-muted-foreground">{group.groupCode}</p>
          </div>
          <div className="flex items-center gap-2">
            {group.system ? (
              <StatusBadge status="info" label={t('common.typeSystem')} />
            ) : (
              <StatusBadge status="default" label={t('common.typeUser')} />
            )}
            <StatusBadge
              status={group.active ? 'success' : 'default'}
              label={group.active ? t('common.statusActive') : t('common.statusInactive')}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewCodes}
            className="h-7"
          >
            {t('codeGroup.childCodeLabel', { count: group.codeCount })}
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
          {!group.system && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
