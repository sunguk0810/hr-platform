import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('recruitment');
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
        toast({ title: t('jobPosting.toast.updated') });
        navigate(`/recruitment/jobs/${id}`);
      } else {
        const result = await createMutation.mutateAsync(formData as CreateJobPostingRequest);
        toast({ title: t('jobPosting.toast.created') });
        navigate(`/recruitment/jobs/${result.data.id}`);
      }
    } catch {
      toast({ title: isEditMode ? t('jobPosting.toast.updateFailed') : t('jobPosting.toast.createFailed'), variant: 'destructive' });
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
        <p className="text-muted-foreground">{t('jobPosting.notFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/recruitment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.backToList')}
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
            {isEditMode ? t('jobPosting.editTitle') : t('jobPosting.createTitle')}
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
        title={isEditMode ? t('jobPosting.editTitle') : t('jobPosting.createTitleFull')}
        description={isEditMode ? t('jobPosting.editDescription', { jobCode: job?.jobCode }) : t('jobPosting.createDescription')}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isEditMode ? t('common.backToDetail') : t('common.backToList')}
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
