import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { menuService } from '../services/menuService';
import type { MenuItemResponse, TenantMenuConfigResponse } from '../types';

export function TenantMenuConfigPage() {
  const { t } = useTranslation('menu');
  const { toast } = useToast();
  const { tenantId } = useAuthStore();
  const [menus, setMenus] = useState<MenuItemResponse[]>([]);
  const [configs, setConfigs] = useState<Map<string, TenantMenuConfigResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const fetchData = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      const [menusData, configsData] = await Promise.all([
        menuService.getAllMenusFlat(),
        menuService.getTenantMenuConfigs(tenantId),
      ]);

      setMenus(menusData ?? []);
      const configMap = new Map<string, TenantMenuConfigResponse>();
      for (const config of (configsData ?? [])) {
        configMap.set(config.menuItemId, config);
      }
      setConfigs(configMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMenus([]);
      setConfigs(new Map());
      toast({
        title: t('tenantConfigToast.loadFailed'),
        description: t('tenantConfigToast.loadFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const handleToggleEnabled = async (menu: MenuItemResponse, enabled: boolean) => {
    if (!tenantId) return;

    try {
      const config = await menuService.updateTenantMenuConfig(tenantId, menu.id, {
        isEnabled: enabled,
      });

      setConfigs((prev) => {
        const newMap = new Map(prev);
        newMap.set(menu.id, config);
        return newMap;
      });

      toast({
        title: enabled ? t('tenantConfigToast.activateSuccess') : t('tenantConfigToast.deactivateSuccess'),
        description: t('tenantConfigToast.toggleSuccessDesc', { name: menu.name, status: enabled ? t('tenantConfigToast.activateSuccess') : t('tenantConfigToast.deactivateSuccess') }),
      });
    } catch (error) {
      console.error('Failed to update config:', error);
      toast({
        title: t('tenantConfigToast.toggleFailed'),
        description: t('tenantConfigToast.toggleFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCustomNameChange = async (menu: MenuItemResponse, customName: string) => {
    if (!tenantId) return;

    try {
      const config = await menuService.updateTenantMenuConfig(tenantId, menu.id, {
        customName: customName || undefined,
      });

      setConfigs((prev) => {
        const newMap = new Map(prev);
        newMap.set(menu.id, config);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to update custom name:', error);
    }
  };

  const handleToggleMobile = async (menu: MenuItemResponse, showInMobile: boolean) => {
    if (!tenantId) return;

    try {
      const config = await menuService.updateTenantMenuConfig(tenantId, menu.id, {
        showInMobile,
      });

      setConfigs((prev) => {
        const newMap = new Map(prev);
        newMap.set(menu.id, config);
        return newMap;
      });

      toast({
        title: showInMobile ? t('tenantConfigToast.mobileShow') : t('tenantConfigToast.mobileHide'),
        description: t('tenantConfigToast.mobileToggleDesc', { name: menu.name, status: showInMobile ? t('tenantConfigToast.mobileShow') : t('tenantConfigToast.mobileHide') }),
      });
    } catch (error) {
      console.error('Failed to update mobile config:', error);
    }
  };

  const handleResetAll = async () => {
    if (!tenantId) return;

    try {
      await menuService.resetAllTenantMenuConfigs(tenantId);
      setConfigs(new Map());
      toast({
        title: t('tenantConfigToast.resetSuccess'),
        description: t('tenantConfigToast.resetSuccessDesc'),
      });
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset configs:', error);
      toast({
        title: t('tenantConfigToast.resetFailed'),
        description: t('tenantConfigToast.resetFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const getEffectiveValue = (menu: MenuItemResponse, config?: TenantMenuConfigResponse) => {
    return {
      isEnabled: config?.isEnabled ?? true,
      customName: config?.customName || '',
      showInMobile: config?.showInMobile ?? menu.showInMobile,
    };
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tenantConfig.title')}</h1>
          <p className="text-muted-foreground">
            {t('tenantConfig.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('tenantConfig.resetAll')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('tenantConfig.enabled')}</TableHead>
                <TableHead>{t('tenantConfig.menu')}</TableHead>
                <TableHead>{t('tenantConfig.customName')}</TableHead>
                <TableHead className="w-[100px]">{t('tenantConfig.mobile')}</TableHead>
                <TableHead className="w-[80px]">{t('tenantConfig.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => {
                const config = configs.get(menu.id);
                const values = getEffectiveValue(menu, config);

                return (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <Switch
                        checked={values.isEnabled}
                        onCheckedChange={(checked) => handleToggleEnabled(menu, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{menu.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {menu.code}
                        </Badge>
                        {menu.level > 1 && (
                          <span className="text-xs text-muted-foreground">
                            {t('tenantConfig.level', { level: menu.level })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder={menu.name}
                        value={values.customName}
                        onChange={(e) => handleCustomNameChange(menu, e.target.value)}
                        className="h-8 w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={values.showInMobile}
                        onCheckedChange={(checked) => handleToggleMobile(menu, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      {config ? (
                        <Badge variant="secondary">{t('tenantConfig.custom')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('tenantConfig.default')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reset Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('resetDialog.description')}
              {' '}{t('resetDialog.warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('resetDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll}>
              {t('resetDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TenantMenuConfigPage;
