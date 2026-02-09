import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { SubmitInterviewScoreRequest, InterviewRecommendation } from '@hr-platform/shared-types';

const RECOMMENDATION_KEYS: { value: InterviewRecommendation; labelKey: string; descKey: string }[] = [
  { value: 'STRONG_HIRE', labelKey: 'interviewScore.recommendations.strongHire', descKey: 'interviewScore.recommendations.strongHireDesc' },
  { value: 'HIRE', labelKey: 'interviewScore.recommendations.hire', descKey: 'interviewScore.recommendations.hireDesc' },
  { value: 'NO_HIRE', labelKey: 'interviewScore.recommendations.noHire', descKey: 'interviewScore.recommendations.noHireDesc' },
  { value: 'STRONG_NO_HIRE', labelKey: 'interviewScore.recommendations.strongNoHire', descKey: 'interviewScore.recommendations.strongNoHireDesc' },
];

interface InterviewScoreFormProps {
  interviewId: string;
  applicantName?: string;
  interviewType?: string;
  onSubmit: (data: SubmitInterviewScoreRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<SubmitInterviewScoreRequest>;
}

interface FormData {
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  problemSolvingScore: number;
  overallScore: number;
  strengths: string;
  weaknesses: string;
  recommendation: InterviewRecommendation;
  comments: string;
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className="text-sm font-medium text-muted-foreground">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={10}
        min={1}
        step={1}
        className="w-full"
      />
    </div>
  );
}

export function InterviewScoreForm({
  applicantName,
  interviewType,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
}: InterviewScoreFormProps) {
  const { t } = useTranslation('recruitment');
  const [confirmWarning, setConfirmWarning] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<SubmitInterviewScoreRequest | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      technicalScore: initialData?.technicalScore ?? 5,
      communicationScore: initialData?.communicationScore ?? 5,
      cultureFitScore: initialData?.cultureFitScore ?? 5,
      problemSolvingScore: initialData?.problemSolvingScore ?? 5,
      overallScore: initialData?.overallScore ?? 5,
      strengths: initialData?.strengths ?? '',
      weaknesses: initialData?.weaknesses ?? '',
      recommendation: initialData?.recommendation ?? 'HIRE',
      comments: initialData?.comments ?? '',
    },
  });

  const technicalScore = watch('technicalScore');
  const communicationScore = watch('communicationScore');
  const cultureFitScore = watch('cultureFitScore');
  const problemSolvingScore = watch('problemSolvingScore');
  const overallScore = watch('overallScore');
  const recommendation = watch('recommendation');

  const validateScoreConsistency = (
    overallScore: number,
    recommendation: InterviewRecommendation
  ): string | null => {
    // Used for validation logic below
    void (recommendation === 'STRONG_HIRE' || recommendation === 'HIRE');
    void (recommendation === 'NO_HIRE' || recommendation === 'STRONG_NO_HIRE');

    // 강력 추천인데 점수가 낮은 경우
    if (recommendation === 'STRONG_HIRE' && overallScore < 8) {
      return t('interviewScore.validation.strongHireMinScore');
    }

    // 추천인데 점수가 낮은 경우
    if (recommendation === 'HIRE' && overallScore < 6) {
      return t('interviewScore.validation.hireMinScore');
    }

    // 비추천인데 점수가 높은 경우
    if (recommendation === 'NO_HIRE' && overallScore > 5) {
      return t('interviewScore.validation.noHireMaxScore');
    }

    // 강력 비추천인데 점수가 높은 경우
    if (recommendation === 'STRONG_NO_HIRE' && overallScore > 3) {
      return t('interviewScore.validation.strongNoHireMaxScore');
    }

    return null;
  };

  const buildPayload = (data: FormData): SubmitInterviewScoreRequest => ({
    technicalScore: data.technicalScore,
    communicationScore: data.communicationScore,
    cultureFitScore: data.cultureFitScore,
    problemSolvingScore: data.problemSolvingScore,
    overallScore: data.overallScore,
    strengths: data.strengths || undefined,
    weaknesses: data.weaknesses || undefined,
    recommendation: data.recommendation,
    comments: data.comments || undefined,
  });

  const handleFormSubmit = (data: FormData) => {
    const consistencyError = validateScoreConsistency(data.overallScore, data.recommendation);
    const payload = buildPayload(data);

    if (consistencyError) {
      setConfirmWarning(`${consistencyError}\n\n${t('interviewScore.consistencyConfirm')}`);
      setPendingPayload(payload);
      return;
    }

    onSubmit(payload);
  };

  const handleConfirmSubmit = () => {
    if (pendingPayload) {
      onSubmit(pendingPayload);
    }
    setConfirmWarning(null);
    setPendingPayload(null);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {(applicantName || interviewType) && (
        <div className="rounded-lg bg-muted p-4">
          {applicantName && (
            <div>
              <p className="text-sm text-muted-foreground">{t('interviewScore.applicant')}</p>
              <p className="font-medium">{applicantName}</p>
            </div>
          )}
          {interviewType && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t('interviewScore.interviewType')}</p>
              <p className="font-medium">{interviewType}</p>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('interviewScore.scoreSection')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreSlider
            label={t('interviewScore.technicalSkill')}
            value={technicalScore}
            onChange={(v) => setValue('technicalScore', v)}
          />
          <ScoreSlider
            label={t('interviewScore.communication')}
            value={communicationScore}
            onChange={(v) => setValue('communicationScore', v)}
          />
          <ScoreSlider
            label={t('interviewScore.cultureFit')}
            value={cultureFitScore}
            onChange={(v) => setValue('cultureFitScore', v)}
          />
          <ScoreSlider
            label={t('interviewScore.problemSolving')}
            value={problemSolvingScore}
            onChange={(v) => setValue('problemSolvingScore', v)}
          />
          <div className="pt-4 border-t">
            <ScoreSlider
              label={t('interviewScore.overallScore')}
              value={overallScore}
              onChange={(v) => setValue('overallScore', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('interviewScore.detailSection')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">{t('interviewScore.strengths')}</Label>
            <Textarea
              id="strengths"
              placeholder={t('interviewScore.strengthsPlaceholder')}
              rows={3}
              {...register('strengths')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weaknesses">{t('interviewScore.weaknesses')}</Label>
            <Textarea
              id="weaknesses"
              placeholder={t('interviewScore.weaknessesPlaceholder')}
              rows={3}
              {...register('weaknesses')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('interviewScore.recommendation')}</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {RECOMMENDATION_KEYS.map((rec) => (
                <label
                  key={rec.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    recommendation === rec.value
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={rec.value}
                    {...register('recommendation', { required: true })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{t(rec.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(rec.descKey)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">{t('interviewScore.additionalComments')}</Label>
            <Textarea
              id="comments"
              placeholder={t('interviewScore.additionalCommentsPlaceholder')}
              rows={4}
              {...register('comments')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.submitting') : t('interviewScore.submitButton')}
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirmWarning}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmWarning(null);
            setPendingPayload(null);
          }
        }}
        title={t('interviewScore.consistencyWarningTitle')}
        description={confirmWarning ?? ''}
        onConfirm={handleConfirmSubmit}
      />
    </form>
  );
}
