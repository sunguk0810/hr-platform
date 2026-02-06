import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { Search, Link2, Unlink, FileText, Plus } from 'lucide-react';
import type { ApprovalStatus } from '@hr-platform/shared-types';
import { APPROVAL_STATUS_LABELS } from '@hr-platform/shared-types';

interface RelatedDocument {
  id: string;
  documentNumber: string;
  title: string;
  status: ApprovalStatus;
  requesterName: string;
  createdAt: string;
}

interface RelatedDocumentsProps {
  approvalId: string;
  isEditable: boolean;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const getStatusBadgeColor = (status: string): string => {
  return STATUS_BADGE_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const mockRelatedDocs: RelatedDocument[] = [
  {
    id: 'rel-1',
    documentNumber: 'APR-2024-001',
    title: '연차 사용 신청',
    status: 'APPROVED',
    requesterName: '김민수',
    createdAt: '2024-12-01',
  },
  {
    id: 'rel-2',
    documentNumber: 'APR-2024-005',
    title: '업무 협조 요청',
    status: 'PENDING',
    requesterName: '이영희',
    createdAt: '2024-12-15',
  },
];

const mockSearchResults: RelatedDocument[] = [
  {
    id: 'appr-010',
    documentNumber: 'APR-2024-010',
    title: '출장 보고서',
    status: 'APPROVED',
    requesterName: '박지현',
    createdAt: '2024-11-20',
  },
  {
    id: 'appr-011',
    documentNumber: 'APR-2024-011',
    title: '비품 구매 요청',
    status: 'APPROVED',
    requesterName: '최동욱',
    createdAt: '2024-11-25',
  },
  {
    id: 'appr-012',
    documentNumber: 'APR-2024-012',
    title: '교육 참가 신청',
    status: 'PENDING',
    requesterName: '정수연',
    createdAt: '2024-12-05',
  },
];

export function RelatedDocuments({ approvalId: _approvalId, isEditable }: RelatedDocumentsProps) {
  const { toast } = useToast();
  const [linkedDocs, setLinkedDocs] = useState<RelatedDocument[]>(mockRelatedDocs);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<RelatedDocument | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredSearchResults = useMemo(() => {
    const linkedIds = new Set(linkedDocs.map((d) => d.id));
    let results = mockSearchResults.filter((r) => !linkedIds.has(r.id));

    if (searchKeyword.trim()) {
      const lower = searchKeyword.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.documentNumber.toLowerCase().includes(lower)
      );
    }

    return results;
  }, [searchKeyword, linkedDocs]);

  const handleLink = (doc: RelatedDocument) => {
    setLinkedDocs((prev) => [...prev, doc]);
    toast({
      title: '관련 문서 연결',
      description: `${doc.documentNumber} 문서가 연결되었습니다.`,
    });
  };

  const handleUnlinkConfirm = () => {
    if (!unlinkTarget) return;
    setLinkedDocs((prev) => prev.filter((d) => d.id !== unlinkTarget.id));
    toast({
      title: '관련 문서 연결 해제',
      description: `${unlinkTarget.documentNumber} 문서의 연결이 해제되었습니다.`,
    });
    setUnlinkTarget(null);
    setIsUnlinkDialogOpen(false);
  };

  const openUnlinkDialog = (doc: RelatedDocument) => {
    setUnlinkTarget(doc);
    setIsUnlinkDialogOpen(true);
  };

  const handleOpenSearchDialog = () => {
    setSearchKeyword('');
    setIsSearchDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              관련 문서
            </span>
            {isEditable && (
              <Button variant="outline" size="sm" onClick={handleOpenSearchDialog}>
                <Plus className="mr-1 h-4 w-4" />
                관련 문서 추가
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linkedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              연결된 관련 문서가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {linkedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {doc.documentNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeColor(doc.status)}
                        >
                          {APPROVAL_STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.requesterName} | {doc.createdAt}
                      </p>
                    </div>
                  </div>
                  {isEditable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-shrink-0 ml-2"
                      onClick={() => openUnlinkDialog(doc)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>관련 문서 검색</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="문서번호 또는 제목으로 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredSearchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filteredSearchResults.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {doc.documentNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeColor(doc.status)}
                        >
                          {APPROVAL_STATUS_LABELS[doc.status] || doc.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.requesterName} | {doc.createdAt}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 ml-2"
                      onClick={() => handleLink(doc)}
                    >
                      <Link2 className="mr-1 h-4 w-4" />
                      링크
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관련 문서 연결 해제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {unlinkTarget?.documentNumber}
            </span>{' '}
            문서의 연결을 해제하시겠습니까?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnlinkDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleUnlinkConfirm}>
              연결 해제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
