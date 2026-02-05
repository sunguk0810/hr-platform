import { useState, useEffect } from 'react';
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
        title: '데이터 로드 실패',
        description: '메뉴 설정을 불러오는데 실패했습니다.',
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
        title: enabled ? '메뉴 활성화' : '메뉴 비활성화',
        description: `${menu.name} 메뉴가 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
      });
    } catch (error) {
      console.error('Failed to update config:', error);
      toast({
        title: '업데이트 실패',
        description: '메뉴 설정을 변경하는데 실패했습니다.',
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
        title: showInMobile ? '모바일 표시' : '모바일 숨김',
        description: `${menu.name} 메뉴가 모바일에 ${showInMobile ? '표시됩니다' : '숨겨집니다'}.`,
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
        title: '초기화 완료',
        description: '모든 메뉴 설정이 기본값으로 초기화되었습니다.',
      });
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset configs:', error);
      toast({
        title: '초기화 실패',
        description: '메뉴 설정을 초기화하는데 실패했습니다.',
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
          <h1 className="text-2xl font-bold">테넌트 메뉴 설정</h1>
          <p className="text-muted-foreground">
            현재 테넌트의 메뉴 표시 여부와 커스텀 이름을 설정합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            전체 초기화
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
                <TableHead className="w-[80px]">활성화</TableHead>
                <TableHead>메뉴</TableHead>
                <TableHead>커스텀 이름</TableHead>
                <TableHead className="w-[100px]">모바일</TableHead>
                <TableHead className="w-[80px]">상태</TableHead>
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
                            레벨 {menu.level}
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
                        <Badge variant="secondary">커스텀</Badge>
                      ) : (
                        <Badge variant="outline">기본</Badge>
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
            <AlertDialogTitle>모든 설정을 초기화하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 테넌트의 모든 메뉴 커스텀 설정이 기본값으로 초기화됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll}>
              초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TenantMenuConfigPage;
