import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('menu');
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
        title: t('toast.loadFailed'),
        description: t('toast.loadFailedDesc'),
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
        title: active ? t('toast.activateSuccess') : t('toast.deactivateSuccess'),
        description: t('toast.toggleSuccessDesc', { name: menu.name, status: active ? t('toast.activateSuccess') : t('toast.deactivateSuccess') }),
      });
      fetchMenus();
    } catch (error) {
      console.error('Failed to update menu:', error);
      toast({
        title: t('toast.toggleFailed'),
        description: t('toast.toggleFailedDesc'),
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
          title: t('toast.editSuccess'),
          description: t('toast.editSuccessDesc'),
        });
      } else {
        await menuService.createMenu(data as CreateMenuItemRequest);
        toast({
          title: t('toast.createSuccess'),
          description: t('toast.createSuccessDesc'),
        });
      }
      setIsFormOpen(false);
      fetchMenus();
    } catch (error) {
      console.error('Failed to save menu:', error);
      toast({
        title: t('toast.saveFailed'),
        description: t('toast.saveFailedDesc'),
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
        title: t('toast.deleteSuccess'),
        description: t('toast.deleteSuccessDesc', { name: deleteMenu.name }),
      });
      setDeleteMenu(undefined);
      fetchMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
      toast({
        title: t('toast.deleteFailed'),
        description: t('toast.deleteFailedDesc'),
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
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchMenus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addMenu')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">{t('menuTree')}</TabsTrigger>
          <TabsTrigger value="mobile">{t('mobilePreview')}</TabsTrigger>
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
                <p className="text-muted-foreground">{t('empty.title')}</p>
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('empty.addFirst')}
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
              {editingMenu ? t('form.editTitle') : parentMenu ? t('form.addChildTitle') : t('form.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('form.description')}
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
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { name: deleteMenu?.name })}
              {deleteMenu?.children && deleteMenu.children.length > 0 && (
                <span className="block mt-2 text-destructive">
                  {t('deleteDialog.childWarning', { count: deleteMenu.children.length })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MenuManagementPage;
