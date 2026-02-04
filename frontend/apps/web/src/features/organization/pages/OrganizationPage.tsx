import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Building2, Plus, Pencil, Trash2, Users, User } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermission } from '@/components/common/PermissionGate';
import { OrgTree } from '../components/OrgTree';
import {
  useOrganizationTree,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useOrganization';
import type { DepartmentTreeNode, CreateDepartmentRequest, UpdateDepartmentRequest } from '@hr-platform/shared-types';

export default function OrganizationPage() {
  const [selectedNode, setSelectedNode] = useState<DepartmentTreeNode | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 조직 편집 권한 체크
  const canEdit = usePermission({ permissions: ['organization:write'] });

  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    code: '',
    name: '',
    nameEn: '',
    parentId: undefined,
  });

  const { data: treeData, isLoading: isTreeLoading, isError: isTreeError } = useOrganizationTree();
  const { data: departmentData } = useDepartment(selectedNode?.id || '');
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const tree = treeData?.data ?? [];
  const selectedDepartment = departmentData?.data;

  const handleSelect = (node: DepartmentTreeNode) => {
    setSelectedNode(node);
  };

  const handleCreateOpen = (parentId?: string) => {
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      parentId,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = () => {
    if (!selectedDepartment) return;
    setFormData({
      code: selectedDepartment.code,
      name: selectedDepartment.name,
      nameEn: selectedDepartment.nameEn || '',
      parentId: selectedDepartment.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedNode) return;
    try {
      const updateData: UpdateDepartmentRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
      };
      await updateMutation.mutateAsync({ id: selectedNode.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    try {
      await deleteMutation.mutateAsync(selectedNode.id);
      setSelectedNode(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  // Flatten tree for parent select
  const flattenTree = (nodes: DepartmentTreeNode[], result: { id: string; name: string; level: number }[] = []): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };
  const flatDepartments = flattenTree(tree);

  return (
    <>
      <PageHeader
        title="조직관리"
        description="조직도 및 부서 정보를 조회하고 관리합니다."
        actions={
          canEdit && (
            <Button onClick={() => handleCreateOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              부서 추가
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>조직도</CardTitle>
          </CardHeader>
          <CardContent>
            {isTreeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : isTreeError ? (
              <EmptyState
                icon={Building2}
                title="조직도를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : tree.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="등록된 부서가 없습니다"
                description="새 부서를 등록하여 조직을 구성하세요."
                action={{
                  label: '부서 추가',
                  onClick: () => handleCreateOpen(),
                }}
              />
            ) : (
              <OrgTree
                data={tree}
                selectedId={selectedNode?.id}
                onSelect={handleSelect}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>부서 상세</CardTitle>
            {selectedDepartment && canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCreateOpen(selectedNode?.id)}>
                  <Plus className="mr-1 h-4 w-4" />
                  하위부서
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditOpen}>
                  <Pencil className="mr-1 h-4 w-4" />
                  수정
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteOpen}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  삭제
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedNode ? (
              <p className="text-muted-foreground text-center py-8">
                좌측 조직도에서 부서를 선택하면 상세 정보가 표시됩니다.
              </p>
            ) : selectedDepartment ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">부서코드</Label>
                    <p className="font-mono text-sm mt-1">{selectedDepartment.code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">부서명</Label>
                    <p className="text-sm mt-1">{selectedDepartment.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">영문명</Label>
                    <p className="text-sm mt-1">{selectedDepartment.nameEn || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">상태</Label>
                    <div className="mt-1">
                      <StatusBadge
                        status={selectedDepartment.status === 'ACTIVE' ? 'success' : 'default'}
                        label={selectedDepartment.status === 'ACTIVE' ? '활성' : '비활성'}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">상위부서</Label>
                    <p className="text-sm mt-1">{selectedDepartment.parentName || '(최상위)'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">조직레벨</Label>
                    <p className="text-sm mt-1">{selectedDepartment.level}단계</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">부서장</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedDepartment.managerName || '미지정'}</p>
                      {selectedDepartment.managerId && (
                        <p className="text-sm text-muted-foreground">
                          {selectedDepartment.managerId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">소속 인원</span>
                    <span className="font-semibold">{selectedDepartment.employeeCount}명</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 추가</DialogTitle>
            <DialogDescription>
              새로운 부서를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parentId">상위부서</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value === 'none' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상위부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(최상위)</SelectItem>
                  {flatDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {'　'.repeat(dept.level - 1)}{dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">부서코드 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="예: DEV-FE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">부서명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 프론트엔드팀"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="예: Frontend Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.code || !formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 수정</DialogTitle>
            <DialogDescription>
              부서 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">부서코드</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">부서명 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">영문명</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 부서를 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{selectedNode?.name}</strong>
              <br />
              <span className="text-destructive">
                하위 부서가 있는 경우 삭제할 수 없습니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
