import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Clock, CheckCircle, XCircle, FileCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useMyRequests,
  useCertificateTypes,
  useCertificateRequestSearchParams,
  useCancelCertificateRequest,
} from '../hooks/useCertificates';
import { CertificateRequestList } from '../components/CertificateRequestList';
import { CertificateRequestForm } from '../components/CertificateRequestForm';
import type { CertificateRequest } from '@hr-platform/shared-types';

export default function MyCertificatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);

  const { params, searchState, setStatus, setTypeCode, setPage } = useCertificateRequestSearchParams();
  const { data: typesData } = useCertificateTypes();
  const { data: requestsData, isLoading } = useMyRequests(params);
  const cancelMutation = useCancelCertificateRequest();

  const certificateTypes = typesData?.data ?? [];
  const requests = requestsData?.data?.content ?? [];
  const totalPages = requestsData?.data?.page?.totalPages ?? 0;

  // Count stats
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const issuedCount = requests.filter(r => r.status === 'ISSUED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  const handleCancelOpen = (request: CertificateRequest) => {
    setSelectedRequest(request);
    setIsCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedRequest) return;
    try {
      await cancelMutation.mutateAsync({ id: selectedRequest.id });
      setIsCancelDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-certificate-requests'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">증명서 신청</h1>
              <p className="text-sm text-muted-foreground">증명서 발급 현황</p>
            </div>
            <Button size="sm" onClick={() => setIsRequestDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              신청
            </Button>
          </div>

          {/* Summary Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs text-muted-foreground">승인대기</span>
              </div>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-muted-foreground">승인</span>
              </div>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-muted-foreground">발급완료</span>
              </div>
              <p className="text-2xl font-bold">{issuedCount}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs text-muted-foreground">반려</span>
              </div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
            </div>
          </div>

          {/* Quick Action */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/certificates/issued')}
              className="flex-1"
            >
              <FileCheck className="mr-1 h-4 w-4" />
              발급 이력
            </Button>
          </div>

          {/* Request List - Using the component for list rendering */}
          <CertificateRequestList
            requests={requests}
            isLoading={isLoading}
            page={searchState.page}
            totalPages={totalPages}
            onPageChange={setPage}
            onCancelRequest={handleCancelOpen}
            certificateTypes={certificateTypes}
            selectedStatus={searchState.status}
            selectedTypeCode={searchState.typeCode}
            onStatusChange={setStatus}
            onTypeCodeChange={setTypeCode}
          />

          {/* Request Dialog */}
          <CertificateRequestForm
            open={isRequestDialogOpen}
            onOpenChange={setIsRequestDialogOpen}
          />

          {/* Cancel Confirmation Dialog */}
          <ConfirmDialog
            open={isCancelDialogOpen}
            onOpenChange={setIsCancelDialogOpen}
            title="신청 취소"
            description={`정말로 이 증명서 신청을 취소하시겠습니까?\n${selectedRequest?.certificateType?.name || ''} (${selectedRequest?.requestNumber || ''})`}
            confirmLabel="취소하기"
            variant="destructive"
            isLoading={cancelMutation.isPending}
            onConfirm={handleCancel}
          />
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="증명서 신청"
        description="증명서를 신청하고 발급 현황을 확인합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/certificates/issued')}>
              <FileCheck className="mr-2 h-4 w-4" />
              발급 이력
            </Button>
            <Button onClick={() => setIsRequestDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              증명서 신청
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" role="region" aria-label="증명서 신청 현황 요약">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30" aria-hidden="true">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="pending-label">승인대기</p>
                <p className="text-2xl font-bold" aria-labelledby="pending-label">{pendingCount}<span className="sr-only">건</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30" aria-hidden="true">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="approved-label">승인</p>
                <p className="text-2xl font-bold" aria-labelledby="approved-label">{approvedCount}<span className="sr-only">건</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30" aria-hidden="true">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="issued-label">발급완료</p>
                <p className="text-2xl font-bold" aria-labelledby="issued-label">{issuedCount}<span className="sr-only">건</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30" aria-hidden="true">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" id="rejected-label">반려</p>
                <p className="text-2xl font-bold" aria-labelledby="rejected-label">{rejectedCount}<span className="sr-only">건</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request List */}
      <CertificateRequestList
        requests={requests}
        isLoading={isLoading}
        page={searchState.page}
        totalPages={totalPages}
        onPageChange={setPage}
        onCancelRequest={handleCancelOpen}
        certificateTypes={certificateTypes}
        selectedStatus={searchState.status}
        selectedTypeCode={searchState.typeCode}
        onStatusChange={setStatus}
        onTypeCodeChange={setTypeCode}
      />

      {/* Request Dialog */}
      <CertificateRequestForm
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="신청 취소"
        description={`정말로 이 증명서 신청을 취소하시겠습니까?\n${selectedRequest?.certificateType?.name || ''} (${selectedRequest?.requestNumber || ''})`}
        confirmLabel="취소하기"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancel}
      />
    </>
  );
}
