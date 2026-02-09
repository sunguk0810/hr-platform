import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Pin, Eye, FileText, Download, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements';

const ADMIN_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];

export default function AnnouncementDetailPage() {
  const { t } = useTranslation('announcement');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasAnyRole } = useAuthStore();
  const isMobile = useIsMobile();
  const canWrite = hasAnyRole(ADMIN_ROLES);

  const CATEGORY_LABELS = useMemo<Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>>(() => ({
    NOTICE: { label: t('categories.NOTICE'), variant: 'default' },
    EVENT: { label: t('categories.EVENT'), variant: 'secondary' },
    UPDATE: { label: t('categories.UPDATE'), variant: 'outline' },
    URGENT: { label: t('categories.URGENT'), variant: 'destructive' },
  }), [t]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, isError } = useAnnouncement(id || '');
  const deleteMutation = useDeleteAnnouncement();

  const announcement = data?.data;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('toast.deleteSuccess'),
        description: t('toast.deleteSuccessDesc'),
      });
      navigate('/announcements');
    } catch {
      toast({
        title: t('toast.deleteFailed'),
        description: t('toast.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{t('notFound.title')}</p>
        <Button variant="outline" onClick={() => navigate('/announcements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('notFound.goToList')}
        </Button>
      </div>
    );
  }

  const categoryInfo = CATEGORY_LABELS[announcement.category] || { label: announcement.category, variant: 'outline' as const };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['announcements', id] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold">{t('title')}</h1>
            </div>
            {canWrite && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/announcements/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('buttons.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('buttons.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Category & Title */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={categoryInfo.variant}>
                {categoryInfo.label}
              </Badge>
              {announcement.isPinned && (
                <Badge variant="outline" className="gap-1">
                  <Pin className="h-3 w-3" />
                  {t('detailPage.pinned')}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold mb-3">{announcement.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{announcement.authorName}</span>
              <span>·</span>
              <span>{announcement.authorDepartment}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{format(new Date(announcement.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {announcement.viewCount}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm">
                {announcement.content}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="bg-card rounded-2xl border p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('detailPage.attachmentWithCount', { count: announcement.attachments.length })}</span>
              </div>
              <div className="space-y-2">
                {announcement.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 active:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('deleteDialog.title')}
          description={t('deleteDialog.description')}
          confirmLabel={t('deleteDialog.confirm')}
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('detail')}
        actions={
          <div className="flex gap-2">
            {canWrite && (
              <>
                <Button variant="outline" onClick={() => navigate(`/announcements/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('buttons.edit')}
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('buttons.delete')}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => navigate('/announcements')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('notFound.goToList')}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={categoryInfo.variant}>
                  {categoryInfo.label}
                </Badge>
                {announcement.isPinned && (
                  <Badge variant="outline" className="gap-1">
                    <Pin className="h-3 w-3" />
                    {t('detailPage.pinned')}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{announcement.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{announcement.authorName}</span>
                <span>·</span>
                <span>{announcement.authorDepartment}</span>
                <span>·</span>
                <span>
                  {format(new Date(announcement.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {announcement.viewCount}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium mb-3">{t('detailPage.attachment')}</h3>
              <div className="space-y-2">
                {announcement.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.fileName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description')}
        confirmLabel={t('deleteDialog.confirm')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
