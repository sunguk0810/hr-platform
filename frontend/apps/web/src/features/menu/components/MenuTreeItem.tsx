import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, GripVertical, Pencil, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getIconWithFallback } from '@/utils/iconMap';
import { Circle } from 'lucide-react';
import type { MenuItemResponse } from '../types';

interface MenuTreeItemProps {
  menu: MenuItemResponse;
  level?: number;
  onEdit?: (menu: MenuItemResponse) => void;
  onDelete?: (menu: MenuItemResponse) => void;
  onAddChild?: (parentMenu: MenuItemResponse) => void;
  onToggleActive?: (menu: MenuItemResponse, active: boolean) => void;
}

export function MenuTreeItem({
  menu,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onToggleActive,
}: MenuTreeItemProps) {
  const { t } = useTranslation('menu');
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = menu.children && menu.children.length > 0;
  const Icon = getIconWithFallback(menu.icon, Circle);

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-card p-3 transition-colors',
          'hover:bg-accent/50',
          !menu.isActive && 'opacity-50'
        )}
        style={{ marginLeft: level * 24 }}
      >
        {/* Drag handle */}
        <button className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand/collapse for items with children */}
        <button
          className={cn(
            'text-muted-foreground hover:text-foreground',
            !hasChildren && 'invisible'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Icon */}
        <Icon className="h-5 w-5 text-muted-foreground" />

        {/* Name and info */}
        <div className="flex flex-1 items-center gap-2">
          <span className="font-medium">{menu.name}</span>
          {menu.nameEn && (
            <span className="text-sm text-muted-foreground">({menu.nameEn})</span>
          )}
          <Badge variant="outline" className="text-xs">
            {menu.code}
          </Badge>
          {menu.path && (
            <span className="text-xs text-muted-foreground">{menu.path}</span>
          )}
          {menu.isSystem && (
            <Badge variant="secondary" className="text-xs">{t('treeItem.system')}</Badge>
          )}
          {menu.showInMobile && (
            <Badge variant="secondary" className="text-xs">{t('treeItem.mobile')}</Badge>
          )}
        </div>

        {/* Permissions */}
        <div className="flex items-center gap-1">
          {menu.roles?.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {role}
            </Badge>
          ))}
          {menu.permissions?.slice(0, 2).map((perm) => (
            <Badge key={perm} variant="outline" className="text-xs text-blue-600">
              {perm}
            </Badge>
          ))}
          {menu.permissions && menu.permissions.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{menu.permissions.length - 2}
            </Badge>
          )}
        </div>

        {/* Active toggle */}
        <Switch
          checked={menu.isActive}
          onCheckedChange={(checked) => onToggleActive?.(menu, checked)}
          disabled={menu.isSystem}
        />

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(menu)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('treeItem.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChild?.(menu)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('treeItem.addChild')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(menu)}
              className="text-destructive focus:text-destructive"
              disabled={menu.isSystem}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('treeItem.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {menu.children!.map((child) => (
            <MenuTreeItem
              key={child.id}
              menu={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuTreeItem;
