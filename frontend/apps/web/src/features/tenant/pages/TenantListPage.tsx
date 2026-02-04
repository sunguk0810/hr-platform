import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { TenantStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Building, Building2, Plus, Search, Users, List, Network } from 'lucide-react';
import {
  useTenantList,
  useTenantSearchParams,
  useCreateTenant,
  useTenantTree,
} from '../hooks/useTenants';
import { TenantTree } from '../components/TenantTree';
import type { TenantStatus, CreateTenantRequest, TenantLevel } from '@hr-platform/shared-types';
import { TENANT_LEVEL_LABELS } from '@hr-platform/shared-types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type ViewMode = 'table' | 'tree';

export default function TenantListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTenantRequest>({
    code: '',
    name: '',
    nameEn: '',
    description: '',
    adminEmail: '',
    adminName: '',
  });
  const [createParentId, setCreateParentId] = useState<string>('');

  const {
    params,
    searchState,
    setKeyword,
    setStatus,
    setPage,
  } = useTenantSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useTenantList(params);
  const { data: treeData, isLoading: isTreeLoading } = useTenantTree();
  const createMutation = useCreateTenant();

  const tenants = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;
  const treeNodes = treeData?.data ?? [];

  // 그룹사 목록 (레벨 0인 테넌트)
  const groupTenants = tenants.filter(t => t.level === 0);

  const handleRowClick = (id: string) => {
    navigate(`/admin/tenants/${id}`);
  };

  const handleCreateOpen = () => {
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      description: '',
      adminEmail: '',
      adminName: '',
    });
    setCreateParentId('');
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...formData,
        parentId: createParentId || undefined,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const renderLevelBadge = (level: TenantLevel) => {
    if (level === 0) {
      return (
        <Badge variant="default" className="text-xs">
          <Building2 className="mr-1 h-3 w-3" />
          {TENANT_LEVEL_LABELS[level]}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <Building className="mr-1 h-3 w-3" />
        {TENANT_LEVEL_LABELS[level]}
      </Badge>
    );
  };

  return (
    <>
      <PageHeader
        title="테넌트 관리"
        description="테넌트(회사)를 조회하고 관리합니다."
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            테넌트 추가
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="테넌트코드, 이름, 관리자 이메일로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={searchState.status}
              onChange={(e) => setStatus(e.target.value as TenantStatus | '')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="SUSPENDED">정지</option>
              <option value="PENDING">대기</option>
            </select>

            {/* 뷰 모드 전환 */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="border rounded-md"
            >
              <ToggleGroupItem value="table" aria-label="테이블 뷰">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="tree" aria-label="트리 뷰">
                <Network className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'tree' ? (
        // 트리 뷰
        <Card>
          <CardContent className="p-4">
            {isTreeLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : treeNodes.length === 0 ? (
              <EmptyState
                icon={Building}
                title="등록된 테넌트가 없습니다"
                description="새 테넌트를 추가해주세요."
                action={{
                  label: '테넌트 추가',
                  onClick: handleCreateOpen,
                }}
              />
            ) : (
              <TenantTree data={treeNodes} />
            )}
          </CardContent>
        </Card>
      ) : (
        // 테이블 뷰
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={Building}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : tenants.length === 0 ? (
              <EmptyState
                icon={Building}
                title="등록된 테넌트가 없습니다"
                description={
                  searchState.keyword || searchState.status
                    ? '검색 조건에 맞는 테넌트가 없습니다.'
                    : '새 테넌트를 추가해주세요.'
                }
                action={
                  !searchState.keyword && !searchState.status
                    ? {
                        label: '테넌트 추가',
                        onClick: handleCreateOpen,
                      }
                    : undefined
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          테넌트코드
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          테넌트명
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          소속 그룹
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          관리자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          직원 수
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          등록일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((tenant) => (
                        <tr
                          key={tenant.id}
                          onClick={() => handleRowClick(tenant.id)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3">
                            {renderLevelBadge(tenant.level)}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">{tenant.code}</td>
                          <td className="px-4 py-3 text-sm font-medium">{tenant.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {tenant.parentName || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {tenant.adminEmail || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {tenant.employeeCount}명
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <TenantStatusBadge status={tenant.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(tenant.createdAt), 'yyyy.M.d', { locale: ko })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={searchState.page}
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
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>테넌트 추가</DialogTitle>
            <DialogDescription>
              새로운 테넌트(회사)를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 그룹사 선택 */}
            {groupTenants.length > 0 && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  소속 그룹사
                </Label>
                <Select
                  value={createParentId || '_none'}
                  onValueChange={(value) => setCreateParentId(value === '_none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="그룹사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">독립 테넌트 (그룹사 없음)</SelectItem>
                    {groupTenants.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {createParentId
                    ? '계열사로 등록됩니다.'
                    : '독립 테넌트(그룹사)로 등록됩니다.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">테넌트코드 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="예: ACME"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">테넌트명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: (주)아크미"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="예: ACME Inc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="테넌트에 대한 간단한 설명"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="adminName">관리자명 *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminEmail">관리자 이메일 *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.code ||
                !formData.name ||
                !formData.adminName ||
                !formData.adminEmail ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
