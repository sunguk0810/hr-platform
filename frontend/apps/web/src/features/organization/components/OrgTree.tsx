import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

interface OrgTreeNodeProps {
  node: DepartmentTreeNode;
  level: number;
  selectedId?: string;
  onSelect?: (node: DepartmentTreeNode) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

function OrgTreeNode({
  node,
  level,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
}: OrgTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = node.id === selectedId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  const handleSelect = () => {
    onSelect?.(node);
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-muted/50',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'p-0.5 rounded hover:bg-muted',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {node.employeeCount}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrgTreeProps {
  data: DepartmentTreeNode[];
  selectedId?: string;
  onSelect?: (node: DepartmentTreeNode) => void;
  className?: string;
}

export function OrgTree({ data, selectedId, onSelect, className }: OrgTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Initially expand first level
    const ids = new Set<string>();
    data.forEach((node) => ids.add(node.id));
    return ids;
  });

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const getAllIds = (nodes: DepartmentTreeNode[]): string[] => {
      return nodes.flatMap((node) => [
        node.id,
        ...getAllIds(node.children || []),
      ]);
    };
    setExpandedIds(new Set(getAllIds(data)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2 pb-2 border-b">
        <button
          type="button"
          onClick={expandAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          전체 펼치기
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          전체 접기
        </button>
      </div>
      <div>
        {data.map((node) => (
          <OrgTreeNode
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            expandedIds={expandedIds}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
