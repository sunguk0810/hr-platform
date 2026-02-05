import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

interface DepartmentAccordionProps {
  departments: DepartmentTreeNode[];
  selectedId?: string;
  onSelect: (department: DepartmentTreeNode) => void;
  expandedIds?: string[];
  onToggleExpand?: (id: string) => void;
}

export function DepartmentAccordion({
  departments,
  selectedId,
  onSelect,
  expandedIds = [],
  onToggleExpand,
}: DepartmentAccordionProps) {
  const [localExpanded, setLocalExpanded] = useState<string[]>([]);

  const expanded = onToggleExpand ? expandedIds : localExpanded;

  const toggleExpand = (id: string) => {
    if (onToggleExpand) {
      onToggleExpand(id);
    } else {
      setLocalExpanded((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const renderDepartment = (dept: DepartmentTreeNode, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expanded.includes(dept.id);
    const isSelected = selectedId === dept.id;

    return (
      <div key={dept.id}>
        <button
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
            isSelected
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted active:bg-muted/80'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onSelect(dept)}
        >
          {/* Expand/Collapse Icon */}
          <button
            className="p-1 -ml-1"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleExpand(dept.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>

          {/* Department Icon */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <Building2 className="h-4 w-4" />
          </div>

          {/* Department Info */}
          <div className="flex-1 text-left">
            <div className="font-medium">{dept.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {dept.employeeCount ?? 0}명
            </div>
          </div>
        </button>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {dept.children!.map((child) => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {departments.map((dept) => renderDepartment(dept))}
    </div>
  );
}
