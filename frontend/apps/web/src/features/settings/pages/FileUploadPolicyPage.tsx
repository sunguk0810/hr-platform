import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { apiClient } from '@/lib/apiClient';
import { Save, Upload, HardDrive, FileType, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtensionGroup {
  labelKey: string;
  extensions: string[];
}

const EXTENSION_GROUPS: ExtensionGroup[] = [
  {
    labelKey: 'fileUploadPolicy.extensionGroups.documents',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.hwp'],
  },
  {
    labelKey: 'fileUploadPolicy.extensionGroups.images',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
  },
  {
    labelKey: 'fileUploadPolicy.extensionGroups.others',
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
  categoryKey: string;
  category: string;
  maxFileSizeMB: number | null;
  allowedExtensions: string[];
}

const CATEGORY_KEYS = [
  'fileUploadPolicy.categories.hrDocuments',
  'fileUploadPolicy.categories.certificates',
  'fileUploadPolicy.categories.approvalAttachments',
  'fileUploadPolicy.categories.profilePhoto',
  'fileUploadPolicy.categories.other',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FileUploadPolicyPage() {
  const { t } = useTranslation('settings');
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
    CATEGORY_KEYS.map((key, idx) => ({
      id: `co-${idx + 1}`,
      categoryKey: key,
      category: key,
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
        const response = await apiClient.get('/settings/file-upload-policy');
        const data = response.data;
        if (data.success) {
          setDefaultPolicy(data.data.defaultPolicy);
          setCategoryOverrides(data.data.categoryOverrides);
        }
      } catch {
        toast({
          title: t('fileUploadPolicy.toast.loadFailed'),
          description: t('fileUploadPolicy.toast.loadFailedDesc'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [toast, t]);

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
      const response = await apiClient.put('/settings/file-upload-policy', {
        defaultPolicy,
        categoryOverrides,
      });
      const data = response.data;

      if (data.success) {
        toast({
          title: t('fileUploadPolicy.toast.saveSuccess'),
          description: t('fileUploadPolicy.toast.saveSuccessDesc'),
        });
      } else {
        toast({
          title: t('fileUploadPolicy.toast.saveFailed'),
          description: data.error?.message || t('fileUploadPolicy.toast.saveFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('fileUploadPolicy.toast.saveFailed'),
        description: t('fileUploadPolicy.toast.saveError'),
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
        title={t('fileUploadPolicy.pageTitle')}
        description={t('fileUploadPolicy.pageDescription')}
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? t('fileUploadPolicy.saving') : t('fileUploadPolicy.save')}
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
                <CardTitle>{t('fileUploadPolicy.defaultPolicy.title')}</CardTitle>
                <CardDescription>
                  {t('fileUploadPolicy.defaultPolicy.description')}
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
                    {t('fileUploadPolicy.defaultPolicy.maxFileSize')}
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
                  <span className="text-sm text-muted-foreground">{t('fileUploadPolicy.defaultPolicy.maxFileSizeUnit')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('fileUploadPolicy.defaultPolicy.maxFileSizeDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTotalStorageGB">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4" />
                    {t('fileUploadPolicy.defaultPolicy.maxTotalStorage')}
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
                  <span className="text-sm text-muted-foreground">{t('fileUploadPolicy.defaultPolicy.maxTotalStorageUnit')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('fileUploadPolicy.defaultPolicy.maxTotalStorageDescription')}
                </p>
              </div>
            </div>

            {/* Allowed extensions */}
            <div className="space-y-4">
              <Label>{t('fileUploadPolicy.defaultPolicy.allowedExtensions')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('fileUploadPolicy.defaultPolicy.allowedExtensionsDescription')}
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
                  <div key={group.labelKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${group.labelKey}`}
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => toggleGroupExtensions(group)}
                      />
                      <Label
                        htmlFor={`group-${group.labelKey}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {t(group.labelKey)}
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
            <CardTitle>{t('fileUploadPolicy.categoryOverrides.title')}</CardTitle>
            <CardDescription>
              {t('fileUploadPolicy.categoryOverrides.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">{t('fileUploadPolicy.categoryOverrides.categoryHeader')}</TableHead>
                    <TableHead className="w-[160px]">{t('fileUploadPolicy.categoryOverrides.maxFileSizeHeader')}</TableHead>
                    <TableHead>{t('fileUploadPolicy.categoryOverrides.allowedExtensionsHeader')}</TableHead>
                    <TableHead className="w-[100px] text-right">{t('fileUploadPolicy.categoryOverrides.actionHeader')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryOverrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell className="font-medium">{t(override.categoryKey)}</TableCell>
                      <TableCell>
                        {override.maxFileSizeMB !== null ? (
                          <span>{override.maxFileSizeMB} MB</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t('fileUploadPolicy.categoryOverrides.defaultValue', { size: defaultPolicy.maxFileSizeMB })}
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
                          <span className="text-muted-foreground text-sm">{t('fileUploadPolicy.categoryOverrides.usingDefault')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(override)}
                        >
                          {t('fileUploadPolicy.categoryOverrides.editButton')}
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
              {t('fileUploadPolicy.editDialog.title', { category: editingOverride ? t(editingOverride.categoryKey) : '' })}
            </DialogTitle>
          </DialogHeader>

          {editingOverride && (
            <div className="space-y-6 py-2">
              {/* Max file size override */}
              <div className="space-y-2">
                <Label htmlFor="overrideMaxFileSizeMB">{t('fileUploadPolicy.editDialog.maxFileSize')}</Label>
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
                  <span className="text-sm text-muted-foreground">{t('fileUploadPolicy.editDialog.maxFileSizeUnit')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('fileUploadPolicy.editDialog.maxFileSizeDescription', { size: defaultPolicy.maxFileSizeMB })}
                </p>
              </div>

              {/* Allowed extensions override */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('fileUploadPolicy.editDialog.allowedExtensions')}</Label>
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
                    {t('fileUploadPolicy.editDialog.resetButton')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('fileUploadPolicy.editDialog.resetDescription')}
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
                    <div key={group.labelKey} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`override-group-${group.labelKey}`}
                          checked={
                            allSelected ? true : someSelected ? 'indeterminate' : false
                          }
                          onCheckedChange={() => toggleOverrideGroupExtensions(group)}
                        />
                        <Label
                          htmlFor={`override-group-${group.labelKey}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {t(group.labelKey)}
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
              {t('fileUploadPolicy.editDialog.cancel')}
            </Button>
            <Button onClick={saveOverrideEdit}>{t('fileUploadPolicy.editDialog.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
