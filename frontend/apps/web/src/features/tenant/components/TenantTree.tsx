import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Building2, Building, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TenantStatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import type { TenantTreeNode } from '@hr-platform/shared-types';

interface TenantTreeProps {
  data: TenantTreeNode[];
  onSelect?: (id: string) => void;
  selectedId?: string;
}

interface TreeNodeProps {
  node: TenantTreeNode;
  level: number;
  onSelect?: (id: string) => void;
  selectedId?: string;
  searchTerm?: string;
}

function TreeNode({ node, level, onSelect, selectedId, searchTerm }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;
  const isGroup = node.level === 0;
  const isSelected = selectedId === node.id;

  // 검색어가 있으면 자동 확장
  React.useEffect(() => {
    if (searchTerm) {
      setIsExpanded(true);
    }
  }, [searchTerm]);

  const handleClick = () => {
    if (onSelect) {
      onSelect(node.id);
    } else {
      navigate(`/admin/tenants/${node.id}`);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 검색 필터링: 본인 또는 자식이 매칭되면 표시
  const matchesSearch = (n: TenantTreeNode, term: string): boolean => {
    if (!term) return true;
    const lower = term.toLowerCase();
    if (n.name.toLowerCase().includes(lower) || n.code.toLowerCase().includes(lower)) {
      return true;
    }
    return n.children?.some(child => matchesSearch(child, term)) || false;
  };

  if (searchTerm && !matchesSearch(node, searchTerm)) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-accent',
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={handleToggle}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Icon */}
        <div
          className={cn(
            'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
            isGroup ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          {isGroup ? (
            <Building2 className="h-4 w-4 text-primary" />
          ) : (
            <Building className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{node.code}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{node.employeeCount}명</span>
            {hasChildren && (
              <span className="text-muted-foreground/70">
                (계열사 {node.children.length}개)
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <TenantStatusBadge status={node.status} />
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TenantTree({ data, onSelect, selectedId }: TenantTreeProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="테넌트 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tree */}
      <div className="border rounded-lg divide-y">
        {data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            등록된 테넌트가 없습니다.
          </div>
        ) : (
          data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onSelect={onSelect}
              selectedId={selectedId}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  );
}
