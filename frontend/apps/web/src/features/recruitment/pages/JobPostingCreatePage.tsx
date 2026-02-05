import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { JobPostingForm } from '../components/JobPostingForm';
import {
  useJobPosting,
  useCreateJobPosting,
  useUpdateJobPosting,
} from '../hooks/useRecruitment';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { CreateJobPostingRequest, UpdateJobPostingRequest } from '@hr-platform/shared-types';

export default function JobPostingCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const isEditMode = !!id;
  const { data, isLoading } = useJobPosting(id || '');
  const createMutation = useCreateJobPosting();
  const updateMutation = useUpdateJobPosting();

  const job = data?.data;

  const handleSubmit = async (formData: CreateJobPostingRequest | UpdateJobPostingRequest) => {
    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data: formData as UpdateJobPostingRequest });
        toast({ title: '채용공고가 수정되었습니다.' });
        navigate(`/recruitment/jobs/${id}`);
      } else {
        const result = await createMutation.mutateAsync(formData as CreateJobPostingRequest);
        toast({ title: '채용공고가 등록되었습니다.' });
        navigate(`/recruitment/jobs/${result.data.id}`);
      }
    } catch {
      toast({ title: isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    navigate(isEditMode ? `/recruitment/jobs/${id}` : '/recruitment');
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEditMode && !job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">채용공고를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/recruitment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="pb-20">
        {/* 모바일 헤더 */}
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold ml-2">
            {isEditMode ? '채용공고 수정' : '새 채용공고'}
          </h1>
        </div>

        <JobPostingForm
          initialData={job}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  // 데스크톱 레이아웃
  return (
    <>
      <PageHeader
        title={isEditMode ? '채용공고 수정' : '새 채용공고 등록'}
        description={isEditMode ? `${job?.jobCode} 공고를 수정합니다.` : '새로운 채용공고를 작성합니다.'}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isEditMode ? '상세로 돌아가기' : '목록으로'}
          </Button>
        }
      />

      <JobPostingForm
        initialData={job}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
