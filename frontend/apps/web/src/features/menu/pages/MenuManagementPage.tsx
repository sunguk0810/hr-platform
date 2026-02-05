import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { menuService } from '../services/menuService';
import { MenuTreeItem } from '../components/MenuTreeItem';
import { MenuItemForm } from '../components/MenuItemForm';
import { MobileMenuPreview } from '../components/MobileMenuPreview';
import type { MenuItemResponse, CreateMenuItemRequest, UpdateMenuItemRequest } from '../types';

export function MenuManagementPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<MenuItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItemResponse | undefined>();
  const [parentMenu, setParentMenu] = useState<MenuItemResponse | undefined>();
  const [deleteMenu, setDeleteMenu] = useState<MenuItemResponse | undefined>();

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const data = await menuService.getAllMenusTree();
      setMenus(data ?? []);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      setMenus([]);
      toast({
        title: '메뉴 로드 실패',
        description: '메뉴 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleCreate = () => {
    setEditingMenu(undefined);
    setParentMenu(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (menu: MenuItemResponse) => {
    setEditingMenu(menu);
    setParentMenu(undefined);
    setIsFormOpen(true);
  };

  const handleAddChild = (parent: MenuItemResponse) => {
    setEditingMenu(undefined);
    setParentMenu(parent);
    setIsFormOpen(true);
  };

  const handleDelete = (menu: MenuItemResponse) => {
    setDeleteMenu(menu);
  };

  const handleToggleActive = async (menu: MenuItemResponse, active: boolean) => {
    try {
      await menuService.updateMenu(menu.id, { isActive: active });
      toast({
        title: active ? '메뉴 활성화' : '메뉴 비활성화',
        description: `${menu.name} 메뉴가 ${active ? '활성화' : '비활성화'}되었습니다.`,
      });
      fetchMenus();
    } catch (error) {
      console.error('Failed to update menu:', error);
      toast({
        title: '업데이트 실패',
        description: '메뉴 상태를 변경하는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: CreateMenuItemRequest | UpdateMenuItemRequest) => {
    setIsSubmitting(true);
    try {
      if (editingMenu) {
        await menuService.updateMenu(editingMenu.id, data as UpdateMenuItemRequest);
        toast({
          title: '메뉴 수정 완료',
          description: '메뉴가 성공적으로 수정되었습니다.',
        });
      } else {
        await menuService.createMenu(data as CreateMenuItemRequest);
        toast({
          title: '메뉴 생성 완료',
          description: '새 메뉴가 성공적으로 생성되었습니다.',
        });
      }
      setIsFormOpen(false);
      fetchMenus();
    } catch (error) {
      console.error('Failed to save menu:', error);
      toast({
        title: '저장 실패',
        description: '메뉴를 저장하는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMenu) return;

    try {
      await menuService.deleteMenu(deleteMenu.id);
      toast({
        title: '메뉴 삭제 완료',
        description: `${deleteMenu.name} 메뉴가 삭제되었습니다.`,
      });
      setDeleteMenu(undefined);
      fetchMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
      toast({
        title: '삭제 실패',
        description: '메뉴를 삭제하는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // Flatten menus for mobile preview
  const flattenMenus = (items: MenuItemResponse[]): MenuItemResponse[] => {
    const result: MenuItemResponse[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children) {
        result.push(...flattenMenus(item.children));
      }
    }
    return result;
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">메뉴 관리</h1>
          <p className="text-muted-foreground">
            동적 메뉴 구조를 관리하고 권한을 설정합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchMenus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            메뉴 추가
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">메뉴 트리</TabsTrigger>
          <TabsTrigger value="mobile">모바일 미리보기</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : menus.length > 0 ? (
            <div className="space-y-2">
              {menus.map((menu) => (
                <MenuTreeItem
                  key={menu.id}
                  menu={menu}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <p className="text-muted-foreground">등록된 메뉴가 없습니다.</p>
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  첫 메뉴 추가
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mobile" className="mt-4">
          <MobileMenuPreview menus={flattenMenus(menus)} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? '메뉴 수정' : parentMenu ? '하위 메뉴 추가' : '메뉴 추가'}
            </DialogTitle>
            <DialogDescription>
              메뉴 정보와 접근 권한을 설정합니다.
            </DialogDescription>
          </DialogHeader>
          <MenuItemForm
            menu={editingMenu}
            parentMenu={parentMenu}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMenu} onOpenChange={() => setDeleteMenu(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMenu?.name} 메뉴를 삭제합니다.
              {deleteMenu?.children && deleteMenu.children.length > 0 && (
                <span className="block mt-2 text-destructive">
                  이 메뉴에는 {deleteMenu.children.length}개의 하위 메뉴가 있습니다.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MenuManagementPage;
