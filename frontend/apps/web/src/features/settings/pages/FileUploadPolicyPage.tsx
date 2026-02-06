import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { Save, Upload, HardDrive, FileType, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtensionGroup {
  label: string;
  extensions: string[];
}

const EXTENSION_GROUPS: ExtensionGroup[] = [
  {
    label: '문서',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.hwp'],
  },
  {
    label: '이미지',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
  },
  {
    label: '기타',
    extensions: ['.zip', '.txt', '.csv'],
  },
];

const ALL_EXTENSIONS = EXTENSION_GROUPS.flatMap((g) => g.extensions);

interface DefaultPolicy {
  maxFileSizeMB: number;
  maxTotalStorageGB: number;
  allowedExtensions: string[];
}

interface CategoryOverride {
  id: string;
  category: string;
  maxFileSizeMB: number | null;
  allowedExtensions: string[];
}

const CATEGORIES = ['인사서류', '증명서', '결재첨부', '프로필사진', '기타'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FileUploadPolicyPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Default policy state
  const [defaultPolicy, setDefaultPolicy] = useState<DefaultPolicy>({
    maxFileSizeMB: 10,
    maxTotalStorageGB: 5,
    allowedExtensions: ALL_EXTENSIONS,
  });

  // Category overrides state
  const [categoryOverrides, setCategoryOverrides] = useState<CategoryOverride[]>(
    CATEGORIES.map((cat, idx) => ({
      id: `co-${idx + 1}`,
      category: cat,
      maxFileSizeMB: null,
      allowedExtensions: [],
    })),
  );

  // Dialog state for editing a category override
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<CategoryOverride | null>(null);

  // Fetch policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch('/api/v1/settings/file-upload-policy');
        const data = await response.json();
        if (data.success) {
          setDefaultPolicy(data.data.defaultPolicy);
          setCategoryOverrides(data.data.categoryOverrides);
        }
      } catch {
        toast({
          title: '설정 조회 실패',
          description: '파일 업로드 정책을 불러올 수 없습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Extension toggle helpers (default policy)
  // ---------------------------------------------------------------------------

  const toggleExtension = (ext: string) => {
    setDefaultPolicy((prev) => {
      const has = prev.allowedExtensions.includes(ext);
      return {
        ...prev,
        allowedExtensions: has
          ? prev.allowedExtensions.filter((e) => e !== ext)
          : [...prev.allowedExtensions, ext],
      };
    });
  };

  const toggleGroupExtensions = (group: ExtensionGroup) => {
    setDefaultPolicy((prev) => {
      const allSelected = group.extensions.every((ext) =>
        prev.allowedExtensions.includes(ext),
      );
      if (allSelected) {
        return {
          ...prev,
          allowedExtensions: prev.allowedExtensions.filter(
            (e) => !group.extensions.includes(e),
          ),
        };
      }
      const merged = new Set([...prev.allowedExtensions, ...group.extensions]);
      return { ...prev, allowedExtensions: Array.from(merged) };
    });
  };

  // ---------------------------------------------------------------------------
  // Extension toggle helpers (category override dialog)
  // ---------------------------------------------------------------------------

  const toggleOverrideExtension = (ext: string) => {
    if (!editingOverride) return;
    const has = editingOverride.allowedExtensions.includes(ext);
    setEditingOverride({
      ...editingOverride,
      allowedExtensions: has
        ? editingOverride.allowedExtensions.filter((e) => e !== ext)
        : [...editingOverride.allowedExtensions, ext],
    });
  };

  const toggleOverrideGroupExtensions = (group: ExtensionGroup) => {
    if (!editingOverride) return;
    const allSelected = group.extensions.every((ext) =>
      editingOverride.allowedExtensions.includes(ext),
    );
    if (allSelected) {
      setEditingOverride({
        ...editingOverride,
        allowedExtensions: editingOverride.allowedExtensions.filter(
          (e) => !group.extensions.includes(e),
        ),
      });
    } else {
      const merged = new Set([
        ...editingOverride.allowedExtensions,
        ...group.extensions,
      ]);
      setEditingOverride({
        ...editingOverride,
        allowedExtensions: Array.from(merged),
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Category override edit
  // ---------------------------------------------------------------------------

  const openEditDialog = (override: CategoryOverride) => {
    setEditingOverride({ ...override });
    setEditDialogOpen(true);
  };

  const saveOverrideEdit = () => {
    if (!editingOverride) return;
    setCategoryOverrides((prev) =>
      prev.map((o) => (o.id === editingOverride.id ? editingOverride : o)),
    );
    setEditDialogOpen(false);
    setEditingOverride(null);
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/settings/file-upload-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultPolicy, categoryOverrides }),
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: '저장 완료',
          description: '파일 업로드 정책이 저장되었습니다.',
        });
      } else {
        toast({
          title: '저장 실패',
          description: data.error?.message || '파일 업로드 정책 저장에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '저장 실패',
        description: '파일 업로드 정책 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="파일 업로드 정책"
        description="테넌트별 파일 업로드 제한 설정을 관리합니다."
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ================================================================
            A. Default Policy Card
        ================================================================ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>테넌트 기본 설정</CardTitle>
                <CardDescription>
                  전체 테넌트에 적용되는 파일 업로드 기본 정책입니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Max file size & total storage */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxFileSizeMB">
                  <div className="flex items-center gap-1.5">
                    <FileType className="h-4 w-4" />
                    최대 파일 크기 (MB)
                  </div>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxFileSizeMB"
                    type="number"
                    min={1}
                    max={100}
                    value={defaultPolicy.maxFileSizeMB}
                    onChange={(e) =>
                      setDefaultPolicy((prev) => ({
                        ...prev,
                        maxFileSizeMB: Number(e.target.value),
                      }))
                    }
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">MB</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  개별 파일의 최대 업로드 크기를 설정합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTotalStorageGB">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4" />
                    최대 총 용량 (GB)
                  </div>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxTotalStorageGB"
                    type="number"
                    min={1}
                    max={100}
                    value={defaultPolicy.maxTotalStorageGB}
                    onChange={(e) =>
                      setDefaultPolicy((prev) => ({
                        ...prev,
                        maxTotalStorageGB: Number(e.target.value),
                      }))
                    }
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">GB</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  테넌트별 전체 파일 저장 용량을 설정합니다.
                </p>
              </div>
            </div>

            {/* Allowed extensions */}
            <div className="space-y-4">
              <Label>허용 확장자</Label>
              <p className="text-xs text-muted-foreground">
                업로드를 허용할 파일 확장자를 선택합니다.
              </p>

              {EXTENSION_GROUPS.map((group) => {
                const allSelected = group.extensions.every((ext) =>
                  defaultPolicy.allowedExtensions.includes(ext),
                );
                const someSelected =
                  !allSelected &&
                  group.extensions.some((ext) =>
                    defaultPolicy.allowedExtensions.includes(ext),
                  );

                return (
                  <div key={group.label} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${group.label}`}
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => toggleGroupExtensions(group)}
                      />
                      <Label
                        htmlFor={`group-${group.label}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {group.label}
                      </Label>
                    </div>
                    <div className="ml-6 flex flex-wrap gap-3">
                      {group.extensions.map((ext) => (
                        <div key={ext} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`ext-${ext}`}
                            checked={defaultPolicy.allowedExtensions.includes(ext)}
                            onCheckedChange={() => toggleExtension(ext)}
                          />
                          <Label
                            htmlFor={`ext-${ext}`}
                            className="text-sm cursor-pointer"
                          >
                            {ext}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================
            B. Category Override Table
        ================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 설정</CardTitle>
            <CardDescription>
              특정 파일 카테고리에 대해 기본 정책을 재정의할 수 있습니다. 설정하지 않은 항목은 기본
              정책을 따릅니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">카테고리</TableHead>
                    <TableHead className="w-[160px]">최대 파일 크기(MB)</TableHead>
                    <TableHead>허용 확장자</TableHead>
                    <TableHead className="w-[100px] text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryOverrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell className="font-medium">{override.category}</TableCell>
                      <TableCell>
                        {override.maxFileSizeMB !== null ? (
                          <span>{override.maxFileSizeMB} MB</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            기본값 ({defaultPolicy.maxFileSizeMB} MB)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {override.allowedExtensions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {override.allowedExtensions.map((ext) => (
                              <Badge key={ext} variant="secondary" className="text-xs">
                                {ext}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">기본값 사용</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(override)}
                        >
                          수정
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================
          Category Override Edit Dialog
      ================================================================ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOverride?.category} - 업로드 정책 수정
            </DialogTitle>
          </DialogHeader>

          {editingOverride && (
            <div className="space-y-6 py-2">
              {/* Max file size override */}
              <div className="space-y-2">
                <Label htmlFor="overrideMaxFileSizeMB">최대 파일 크기 (MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="overrideMaxFileSizeMB"
                    type="number"
                    min={0}
                    max={100}
                    value={editingOverride.maxFileSizeMB ?? ''}
                    placeholder={String(defaultPolicy.maxFileSizeMB)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingOverride({
                        ...editingOverride,
                        maxFileSizeMB: val === '' ? null : Number(val),
                      });
                    }}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">MB</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  비워두면 기본값({defaultPolicy.maxFileSizeMB} MB)을 사용합니다.
                </p>
              </div>

              {/* Allowed extensions override */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>허용 확장자</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingOverride({
                        ...editingOverride,
                        allowedExtensions: [],
                      })
                    }
                  >
                    초기화 (기본값 사용)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  선택하지 않으면 기본 정책의 허용 확장자를 따릅니다.
                </p>

                {EXTENSION_GROUPS.map((group) => {
                  const allSelected = group.extensions.every((ext) =>
                    editingOverride.allowedExtensions.includes(ext),
                  );
                  const someSelected =
                    !allSelected &&
                    group.extensions.some((ext) =>
                      editingOverride.allowedExtensions.includes(ext),
                    );

                  return (
                    <div key={group.label} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`override-group-${group.label}`}
                          checked={
                            allSelected ? true : someSelected ? 'indeterminate' : false
                          }
                          onCheckedChange={() => toggleOverrideGroupExtensions(group)}
                        />
                        <Label
                          htmlFor={`override-group-${group.label}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {group.label}
                        </Label>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-3">
                        {group.extensions.map((ext) => (
                          <div key={ext} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`override-ext-${ext}`}
                              checked={editingOverride.allowedExtensions.includes(ext)}
                              onCheckedChange={() => toggleOverrideExtension(ext)}
                            />
                            <Label
                              htmlFor={`override-ext-${ext}`}
                              className="text-sm cursor-pointer"
                            >
                              {ext}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={saveOverrideEdit}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
