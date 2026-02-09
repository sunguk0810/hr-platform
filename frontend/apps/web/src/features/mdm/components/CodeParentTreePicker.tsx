import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCodeTree } from '../hooks/useMdm';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeTreeNode } from '@hr-platform/shared-types';

interface CodeParentTreePickerProps {
  groupCode: string;
  value?: string; // selected code
  onChange: (code: string | undefined, node?: CodeTreeNode) => void;
  placeholder?: string;
  excludeId?: string; // exclude this node and its descendants
}

function PickerTreeNode({
  node,
  level,
  selectedCode,
  onSelect,
  excludeId,
}: {
  node: CodeTreeNode;
  level: number;
  selectedCode?: string;
  onSelect: (code: string, node: CodeTreeNode) => void;
  excludeId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.code === selectedCode;
  const isExcluded = node.id === excludeId;

  if (isExcluded) return null;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded px-2 py-1 cursor-pointer text-sm hover:bg-muted/50',
          isSelected && 'bg-primary/10 text-primary font-medium'
        )}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => !isExcluded && onSelect(node.code, node)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {hasChildren ? (
          isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-yellow-600" /> : <Folder className="h-3.5 w-3.5 text-yellow-600" />
        ) : (
          <FileCode className="h-3.5 w-3.5 text-blue-600" />
        )}
        <span className="font-mono text-xs">{node.code}</span>
        <span className="text-muted-foreground text-xs">-</span>
        <span className="truncate text-xs">{node.codeName}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <PickerTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedCode={selectedCode}
              onSelect={onSelect}
              excludeId={excludeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeParentTreePicker({
  groupCode,
  value,
  onChange,
  placeholder,
  excludeId,
}: CodeParentTreePickerProps) {
  const { t } = useTranslation('mdm');
  const [open, setOpen] = useState(false);
  const { data } = useCodeTree(groupCode);
  const treeData = data?.data ?? [];

  // Find node by code
  const findNode = (nodes: CodeTreeNode[], code: string): CodeTreeNode | undefined => {
    for (const node of nodes) {
      if (node.code === code) return node;
      const found = findNode(node.children || [], code);
      if (found) return found;
    }
    return undefined;
  };

  const selectedNode = value ? findNode(treeData, value) : undefined;

  const handleSelect = (code: string, node: CodeTreeNode) => {
    onChange(code, node);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {selectedNode ? (
            <span className="flex items-center gap-1 truncate">
              <span className="font-mono text-xs">{selectedNode.code}</span>
              <span className="text-muted-foreground">-</span>
              <span className="truncate">{selectedNode.codeName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder || t('parentTreePicker.placeholder')}</span>
          )}
          <div className="flex items-center gap-1">
            {value && (
              <button type="button" onClick={handleClear} className="hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-2" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {treeData.length > 0 ? (
            treeData.map((node) => (
              <PickerTreeNode
                key={node.id}
                node={node}
                level={0}
                selectedCode={value}
                onSelect={handleSelect}
                excludeId={excludeId}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {groupCode ? t('parentTreePicker.noCodesWithGroup') : t('parentTreePicker.selectGroupFirst')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
