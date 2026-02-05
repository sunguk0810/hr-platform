import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SubmitInterviewScoreRequest, InterviewRecommendation } from '@hr-platform/shared-types';

const RECOMMENDATIONS: { value: InterviewRecommendation; label: string; description: string }[] = [
  { value: 'STRONG_HIRE', label: '강력 추천', description: '반드시 채용해야 할 인재' },
  { value: 'HIRE', label: '추천', description: '채용을 권장함' },
  { value: 'NO_HIRE', label: '비추천', description: '채용을 권장하지 않음' },
  { value: 'STRONG_NO_HIRE', label: '강력 비추천', description: '채용 불가' },
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
      return '강력 추천의 경우 종합 평가 점수가 8점 이상이어야 합니다.';
    }

    // 추천인데 점수가 낮은 경우
    if (recommendation === 'HIRE' && overallScore < 6) {
      return '추천의 경우 종합 평가 점수가 6점 이상이어야 합니다.';
    }

    // 비추천인데 점수가 높은 경우
    if (recommendation === 'NO_HIRE' && overallScore > 5) {
      return '비추천의 경우 종합 평가 점수가 5점 이하여야 합니다.';
    }

    // 강력 비추천인데 점수가 높은 경우
    if (recommendation === 'STRONG_NO_HIRE' && overallScore > 3) {
      return '강력 비추천의 경우 종합 평가 점수가 3점 이하여야 합니다.';
    }

    return null;
  };

  const handleFormSubmit = (data: FormData) => {
    // 점수와 추천 의견 일관성 검증
    const consistencyError = validateScoreConsistency(data.overallScore, data.recommendation);
    if (consistencyError) {
      const proceed = window.confirm(
        `${consistencyError}\n\n그래도 제출하시겠습니까?`
      );
      if (!proceed) return;
    }

    const payload: SubmitInterviewScoreRequest = {
      technicalScore: data.technicalScore,
      communicationScore: data.communicationScore,
      cultureFitScore: data.cultureFitScore,
      problemSolvingScore: data.problemSolvingScore,
      overallScore: data.overallScore,
      strengths: data.strengths || undefined,
      weaknesses: data.weaknesses || undefined,
      recommendation: data.recommendation,
      comments: data.comments || undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {(applicantName || interviewType) && (
        <div className="rounded-lg bg-muted p-4">
          {applicantName && (
            <div>
              <p className="text-sm text-muted-foreground">지원자</p>
              <p className="font-medium">{applicantName}</p>
            </div>
          )}
          {interviewType && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">면접 유형</p>
              <p className="font-medium">{interviewType}</p>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>평가 점수</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreSlider
            label="기술 역량"
            value={technicalScore}
            onChange={(v) => setValue('technicalScore', v)}
          />
          <ScoreSlider
            label="커뮤니케이션"
            value={communicationScore}
            onChange={(v) => setValue('communicationScore', v)}
          />
          <ScoreSlider
            label="조직 문화 적합성"
            value={cultureFitScore}
            onChange={(v) => setValue('cultureFitScore', v)}
          />
          <ScoreSlider
            label="문제 해결 능력"
            value={problemSolvingScore}
            onChange={(v) => setValue('problemSolvingScore', v)}
          />
          <div className="pt-4 border-t">
            <ScoreSlider
              label="종합 평가"
              value={overallScore}
              onChange={(v) => setValue('overallScore', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>세부 평가</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">강점</Label>
            <Textarea
              id="strengths"
              placeholder="지원자의 강점을 작성해주세요."
              rows={3}
              {...register('strengths')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weaknesses">약점/개선점</Label>
            <Textarea
              id="weaknesses"
              placeholder="지원자의 약점이나 개선이 필요한 부분을 작성해주세요."
              rows={3}
              {...register('weaknesses')}
            />
          </div>

          <div className="space-y-2">
            <Label>채용 추천 의견 *</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {RECOMMENDATIONS.map((rec) => (
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
                    <p className="font-medium">{rec.label}</p>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">추가 의견</Label>
            <Textarea
              id="comments"
              placeholder="추가적인 의견이나 코멘트를 작성해주세요."
              rows={4}
              {...register('comments')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '제출 중...' : '평가 제출'}
        </Button>
      </div>
    </form>
  );
}
