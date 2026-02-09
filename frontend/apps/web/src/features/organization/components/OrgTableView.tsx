import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronRight, ChevronDown, Building2, Users, User } from 'lucide-react';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

export interface OrgTableViewProps {
  data: DepartmentTreeNode[];
  onDepartmentClick?: (departmentId: string) => void;
  showEmployeeCount?: boolean;
  showManager?: boolean;
  showStatus?: boolean;
  className?: string;
}

interface FlattenedNode extends DepartmentTreeNode {
  depth: number;
  hasChildren: boolean;
}

export function OrgTableView({
  data,
  onDepartmentClick,
  showEmployeeCount = true,
  showManager = true,
  showStatus = true,
  className,
}: OrgTableViewProps) {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  // Initialize with top-level items expanded
  React.useEffect(() => {
    const topLevelIds = new Set(data.map((node) => node.id));
    setExpandedIds(topLevelIds);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: DepartmentTreeNode[]) => {
      nodes.forEach((node) => {
        allIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(data);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Flatten tree for table rendering
  const flattenedData = React.useMemo(() => {
    const result: FlattenedNode[] = [];

    const flatten = (nodes: DepartmentTreeNode[], depth: number) => {
      nodes.forEach((node) => {
        const hasChildren = !!(node.children && node.children.length > 0);
        result.push({ ...node, depth, hasChildren });

        if (hasChildren && expandedIds.has(node.id)) {
          flatten(node.children!, depth + 1);
        }
      });
    };

    flatten(data, 0);
    return result;
  }, [data, expandedIds]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          {tCommon('expandAll')}
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          {tCommon('collapseAll')}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{t('history.department')}</TableHead>
              <TableHead>{t('department.code')}</TableHead>
              {showManager && <TableHead>{t('department.head')}</TableHead>}
              {showEmployeeCount && <TableHead className="text-center">{t('department.memberCount')}</TableHead>}
              {showStatus && <TableHead>{tCommon('status')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3 + (showManager ? 1 : 0) + (showEmployeeCount ? 1 : 0) + (showStatus ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('department.noDepartments')}
                </TableCell>
              </TableRow>
            ) : (
              flattenedData.map((node) => (
                <TableRow
                  key={node.id}
                  className={cn(
                    'transition-colors',
                    onDepartmentClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                >
                  <TableCell>
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${node.depth * 24}px` }}
                    >
                      {node.hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(node.id);
                          }}
                          className="p-0.5 rounded hover:bg-muted"
                        >
                          {expandedIds.has(node.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={cn(
                          'font-medium',
                          onDepartmentClick && 'hover:underline'
                        )}
                        onClick={() => onDepartmentClick?.(node.id)}
                      >
                        {node.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {node.code}
                  </TableCell>
                  {showManager && (
                    <TableCell>
                      {node.managerName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{node.managerName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {showEmployeeCount && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{node.employeeCount ?? 0}</span>
                      </div>
                    </TableCell>
                  )}
                  {showStatus && (
                    <TableCell>
                      <StatusBadge
                        status={node.status === 'ACTIVE' ? 'success' : 'default'}
                        label={node.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
