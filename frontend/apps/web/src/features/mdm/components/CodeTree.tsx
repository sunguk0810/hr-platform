import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from 'lucide-react';
import { useCodeTree } from '../hooks/useMdm';
import type { CodeTreeNode } from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';

interface CodeTreeProps {
  groupCode: string;
  onSelect?: (node: CodeTreeNode) => void;
  onContextMenu?: (event: React.MouseEvent, node: CodeTreeNode) => void;
  selectedId?: string;
}

interface TreeNodeProps {
  node: CodeTreeNode;
  onSelect?: (node: CodeTreeNode) => void;
  onContextMenu?: (event: React.MouseEvent, node: CodeTreeNode) => void;
  selectedId?: string;
  level: number;
}

function TreeNode({ node, onSelect, onContextMenu, selectedId, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = () => {
    onSelect?.(node);
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors',
          isSelected && 'bg-primary/10 hover:bg-primary/15'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e, node);
        }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-yellow-600" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-600" />
          )
        ) : (
          <FileCode className="h-4 w-4 text-blue-600" />
        )}

        <span className="ml-1 font-mono text-sm">{node.code}</span>
        <span className="text-muted-foreground">-</span>
        <span className="flex-1 truncate text-sm">{node.codeName}</span>
        {node.codeNameEn && (
          <span className="text-xs text-muted-foreground">({node.codeNameEn})</span>
        )}
        <StatusBadge
          status={node.active ? 'success' : 'default'}
          label={node.active ? '활성' : '비활성'}
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-border ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeTree({ groupCode, onSelect, onContextMenu, selectedId }: CodeTreeProps) {
  const { data, isLoading, isError } = useCodeTree(groupCode);
  const treeData = data?.data ?? [];

  if (!groupCode) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        코드그룹을 선택하세요.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        등록된 코드가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {treeData.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          selectedId={selectedId}
          level={0}
        />
      ))}
    </div>
  );
}

// Expandable tree view wrapper
interface CodeTreeViewProps {
  groupCode: string;
  className?: string;
}

export function CodeTreeView({ groupCode, className }: CodeTreeViewProps) {
  const [selectedNode, setSelectedNode] = useState<CodeTreeNode | null>(null);

  return (
    <div className={cn('flex gap-4', className)}>
      <div className="flex-1 rounded-lg border p-4">
        <h3 className="mb-4 font-medium">코드 트리</h3>
        <CodeTree
          groupCode={groupCode}
          onSelect={setSelectedNode}
          selectedId={selectedNode?.id}
        />
      </div>

      {selectedNode && (
        <div className="w-80 rounded-lg border p-4">
          <h3 className="mb-4 font-medium">선택된 코드</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">코드</div>
              <div className="font-mono font-medium">{selectedNode.code}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">코드명</div>
              <div className="font-medium">{selectedNode.codeName}</div>
            </div>
            {selectedNode.codeNameEn && (
              <div>
                <div className="text-sm text-muted-foreground">영문명</div>
                <div>{selectedNode.codeNameEn}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">계층 레벨</div>
              <div>{selectedNode.level + 1}단계</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">정렬순서</div>
              <div>{selectedNode.sortOrder}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">상태</div>
              <StatusBadge
                status={selectedNode.active ? 'success' : 'default'}
                label={selectedNode.active ? '활성' : '비활성'}
              />
            </div>
            {selectedNode.children.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground">하위 코드</div>
                <div>{selectedNode.children.length}개</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
