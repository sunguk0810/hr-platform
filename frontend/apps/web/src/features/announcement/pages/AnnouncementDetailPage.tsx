import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Pin, Eye, FileText, Download } from 'lucide-react';
import { useAnnouncement } from '../hooks/useAnnouncements';

const CATEGORY_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  NOTICE: { label: '공지', variant: 'default' },
  EVENT: { label: '이벤트', variant: 'secondary' },
  UPDATE: { label: '업데이트', variant: 'outline' },
  URGENT: { label: '긴급', variant: 'destructive' },
};

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useAnnouncement(id || '');

  const announcement = data?.data;

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
        <p className="text-muted-foreground">공지사항을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/announcements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  const categoryInfo = CATEGORY_LABELS[announcement.category] || { label: announcement.category, variant: 'outline' as const };

  return (
    <>
      <PageHeader
        title="공지사항"
        description="공지사항 상세 내용"
        actions={
          <Button variant="outline" onClick={() => navigate('/announcements')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
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
                    고정
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
              <h3 className="text-sm font-medium mb-3">첨부파일</h3>
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
    </>
  );
}
