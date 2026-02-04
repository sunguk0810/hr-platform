import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Pencil, RotateCcw, Building2 } from 'lucide-react';
import {
  useTenantCodeList,
  useCodeGroupList,
  useUpdateTenantCode,
  useResetTenantCode,
} from '../hooks/useMdm';
import type { TenantCodeSetting, UpdateTenantCodeRequest } from '@hr-platform/shared-types';

export default function TenantCodePage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);
  const [groupCode, setGroupCode] = useState('');
  const [isEnabledFilter, setIsEnabledFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<TenantCodeSetting | null>(null);
  const [formData, setFormData] = useState<UpdateTenantCodeRequest>({
    customName: '',
    customNameEn: '',
    isEnabled: true,
    sortOrder: undefined,
  });

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, groupCode, isEnabledFilter]);

  const { data: codeGroupsData } = useCodeGroupList({ size: 100 });
  const codeGroups = codeGroupsData?.data?.content ?? [];

  const { data, isLoading, isError } = useTenantCodeList({
    page,
    size: 20,
    groupCode: groupCode || undefined,
    keyword: debouncedKeyword || undefined,
    isEnabled: isEnabledFilter ?? undefined,
  });

  const updateMutation = useUpdateTenantCode();
  const resetMutation = useResetTenantCode();

  const tenantCodes = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleEditOpen = (setting: TenantCodeSetting) => {
    setSelectedSetting(setting);
    setFormData({
      customName: setting.customName || '',
      customNameEn: setting.customNameEn || '',
      isEnabled: setting.isEnabled,
      sortOrder: setting.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleResetOpen = (setting: TenantCodeSetting) => {
    setSelectedSetting(setting);
    setIsResetDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSetting) return;
    try {
      await updateMutation.mutateAsync({
        codeId: selectedSetting.codeId,
        data: formData,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update tenant code:', error);
    }
  };

  const handleReset = async () => {
    if (!selectedSetting) return;
    try {
      await resetMutation.mutateAsync(selectedSetting.codeId);
      setIsResetDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset tenant code:', error);
    }
  };

  const handleToggleEnabled = async (setting: TenantCodeSetting) => {
    try {
      await updateMutation.mutateAsync({
        codeId: setting.codeId,
        data: { isEnabled: !setting.isEnabled },
      });
    } catch (error) {
      console.error('Failed to toggle enabled:', error);
    }
  };

  return (
    <>
      <PageHeader
        title="테넌트 코드 관리"
        description="테넌트별로 공통코드를 커스터마이징합니다."
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="코드, 코드명으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 코드그룹</option>
              {codeGroups.map((group) => (
                <option key={group.id} value={group.code}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              value={isEnabledFilter === null ? '' : isEnabledFilter.toString()}
              onChange={(e) => setIsEnabledFilter(e.target.value === '' ? null : e.target.value === 'true')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 상태</option>
              <option value="true">활성화됨</option>
              <option value="false">비활성화됨</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={Building2}
              title="데이터를 불러올 수 없습니다"
              description="잠시 후 다시 시도해주세요."
            />
          ) : tenantCodes.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="설정된 테넌트 코드가 없습니다"
              description={
                searchInput || groupCode
                  ? '검색 조건에 맞는 테넌트 코드가 없습니다.'
                  : '공통코드에 테넌트별 설정을 추가하세요.'
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        코드그룹
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        코드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        원본 이름
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        커스텀 이름
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        활성화
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        수정일
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantCodes.map((setting) => (
                      <tr
                        key={setting.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {setting.groupCode}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{setting.code}</td>
                        <td className="px-4 py-3 text-sm">{setting.originalName}</td>
                        <td className="px-4 py-3 text-sm">
                          {setting.customName ? (
                            <span className="font-medium text-primary">{setting.customName}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={setting.isEnabled}
                            onCheckedChange={() => handleToggleEnabled(setting)}
                            disabled={updateMutation.isPending}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(setting.updatedAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(setting)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetOpen(setting)}
                              disabled={!setting.customName && setting.isEnabled}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <div className="px-4 pb-3 text-sm text-muted-foreground">
                총 {totalElements}개
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테넌트 코드 설정</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{selectedSetting?.code}</strong>의 테넌트별 설정을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md bg-muted p-3">
              <div className="text-sm text-muted-foreground">원본 이름</div>
              <div className="font-medium">{selectedSetting?.originalName}</div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customName">커스텀 이름</Label>
              <Input
                id="customName"
                value={formData.customName}
                onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                placeholder="이 테넌트에서 사용할 이름"
              />
              <p className="text-xs text-muted-foreground">
                비워두면 원본 이름이 사용됩니다.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customNameEn">커스텀 영문명</Label>
              <Input
                id="customNameEn"
                value={formData.customNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, customNameEn: e.target.value }))}
                placeholder="이 테넌트에서 사용할 영문명"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">정렬순서</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder ?? ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sortOrder: e.target.value ? parseInt(e.target.value) : undefined,
                }))}
                placeholder="비워두면 기본 순서 사용"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
              />
              <Label htmlFor="isEnabled">이 테넌트에서 활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기본값으로 초기화</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{selectedSetting?.code}</strong>의 테넌트 설정을 기본값으로 초기화합니다.
              <br />
              커스텀 이름이 제거되고 활성화 상태로 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? '초기화 중...' : '초기화'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
