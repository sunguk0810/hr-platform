import { useForm } from 'react-hook-form';
import { format, addHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateInterviewRequest, InterviewType } from '@hr-platform/shared-types';

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: 'PHONE', label: '전화면접' },
  { value: 'VIDEO', label: '화상면접' },
  { value: 'ONSITE', label: '대면면접' },
  { value: 'TECHNICAL', label: '기술면접' },
  { value: 'FINAL', label: '최종면접' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
];

interface InterviewScheduleFormProps {
  applicationId: string;
  applicantName?: string;
  onSubmit: (data: CreateInterviewRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormData {
  interviewType: InterviewType;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: string;
  location: string;
  meetingUrl: string;
  interviewerIds: string;
  notes: string;
}

export function InterviewScheduleForm({
  applicationId,
  applicantName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InterviewScheduleFormProps) {
  const defaultDate = format(addHours(new Date(), 24), 'yyyy-MM-dd');
  const defaultTime = '10:00';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      interviewType: 'VIDEO',
      scheduledDate: defaultDate,
      scheduledTime: defaultTime,
      durationMinutes: '60',
      location: '',
      meetingUrl: '',
      interviewerIds: '',
      notes: '',
    },
  });

  const interviewType = watch('interviewType');
  const showLocation = interviewType === 'ONSITE';
  const showMeetingUrl = interviewType === 'VIDEO' || interviewType === 'PHONE';

  const validateFutureDateTime = (date: string, time: string): string | null => {
    const scheduledDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      return '면접 일시는 현재 시간 이후여야 합니다.';
    }

    // 최소 1시간 이후 예약 권장
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    if (scheduledDateTime < oneHourLater) {
      return '면접은 최소 1시간 이후로 예약해주세요.';
    }

    return null;
  };

  const handleFormSubmit = (data: FormData) => {
    // 미래 날짜/시간 검증
    const dateTimeError = validateFutureDateTime(data.scheduledDate, data.scheduledTime);
    if (dateTimeError) {
      alert(dateTimeError);
      return;
    }

    const scheduledAt = `${data.scheduledDate}T${data.scheduledTime}:00`;
    const interviewerIds = data.interviewerIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id);

    const payload: CreateInterviewRequest = {
      applicationId,
      interviewType: data.interviewType,
      scheduledAt,
      durationMinutes: parseInt(data.durationMinutes),
      location: data.location || undefined,
      meetingUrl: data.meetingUrl || undefined,
      interviewerIds: interviewerIds.length > 0 ? interviewerIds : ['emp-001'], // 기본 면접관
      notes: data.notes || undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {applicantName && (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm text-muted-foreground">지원자</p>
          <p className="font-medium">{applicantName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="interviewType">면접 유형 *</Label>
        <select
          id="interviewType"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('interviewType', { required: true })}
        >
          {INTERVIEW_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">날짜 *</Label>
          <Input
            id="scheduledDate"
            type="date"
            {...register('scheduledDate', { required: '날짜를 입력해주세요.' })}
          />
          {errors.scheduledDate && (
            <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">시간 *</Label>
          <Input
            id="scheduledTime"
            type="time"
            {...register('scheduledTime', { required: '시간을 입력해주세요.' })}
          />
          {errors.scheduledTime && (
            <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="durationMinutes">면접 시간 *</Label>
        <select
          id="durationMinutes"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('durationMinutes', { required: true })}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {showLocation && (
        <div className="space-y-2">
          <Label htmlFor="location">면접 장소</Label>
          <Input
            id="location"
            placeholder="예: 본사 3층 회의실"
            {...register('location')}
          />
        </div>
      )}

      {showMeetingUrl && (
        <div className="space-y-2">
          <Label htmlFor="meetingUrl">화상회의 URL</Label>
          <Input
            id="meetingUrl"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            {...register('meetingUrl')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="interviewerIds">면접관 (사번, 콤마로 구분)</Label>
        <Input
          id="interviewerIds"
          placeholder="emp-001, emp-002"
          {...register('interviewerIds')}
        />
        <p className="text-xs text-muted-foreground">
          비워두면 기본 면접관이 배정됩니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          placeholder="면접 관련 메모 (지원자에게 전달 사항 등)"
          rows={3}
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '면접 일정 등록'}
        </Button>
      </div>
    </form>
  );
}
