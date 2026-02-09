import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { format, addHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateInterviewRequest, InterviewType } from '@hr-platform/shared-types';
import { showErrorToast } from '@/components/common/Error/ErrorToast';

const INTERVIEW_TYPE_KEYS: { value: InterviewType; key: string }[] = [
  { value: 'FIRST_ROUND', key: 'interviewScheduleForm.interviewTypes.firstRound' },
  { value: 'SECOND_ROUND', key: 'interviewScheduleForm.interviewTypes.secondRound' },
  { value: 'FINAL_ROUND', key: 'interviewScheduleForm.interviewTypes.finalRound' },
  { value: 'TECHNICAL', key: 'interviewScheduleForm.interviewTypes.technical' },
  { value: 'PERSONALITY', key: 'interviewScheduleForm.interviewTypes.personality' },
  { value: 'PRESENTATION', key: 'interviewScheduleForm.interviewTypes.presentation' },
  { value: 'GROUP', key: 'interviewScheduleForm.interviewTypes.group' },
  { value: 'VIDEO', key: 'interviewScheduleForm.interviewTypes.video' },
  { value: 'PHONE', key: 'interviewScheduleForm.interviewTypes.phone' },
];

const DURATION_OPTION_KEYS: { value: number; key: string }[] = [
  { value: 30, key: 'interviewScheduleForm.durationOptions.thirtyMin' },
  { value: 60, key: 'interviewScheduleForm.durationOptions.oneHour' },
  { value: 90, key: 'interviewScheduleForm.durationOptions.oneHalfHour' },
  { value: 120, key: 'interviewScheduleForm.durationOptions.twoHours' },
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
  const { t } = useTranslation('recruitment');
  const defaultDate = format(addHours(new Date(), 24), 'yyyy-MM-dd');
  const defaultTime = '10:00';

  const {
    register,
    control,
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
  const showLocation = interviewType !== 'VIDEO' && interviewType !== 'PHONE';
  const showMeetingUrl = interviewType === 'VIDEO' || interviewType === 'PHONE';

  const validateFutureDateTime = (date: string, time: string): string | null => {
    const scheduledDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      return t('interviewScheduleForm.validation.futureDateTime');
    }

    // 최소 1시간 이후 예약 권장
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    if (scheduledDateTime < oneHourLater) {
      return t('interviewScheduleForm.validation.minimumOneHour');
    }

    return null;
  };

  const handleFormSubmit = (data: FormData) => {
    // 미래 날짜/시간 검증
    const dateTimeError = validateFutureDateTime(data.scheduledDate, data.scheduledTime);
    if (dateTimeError) {
      showErrorToast(dateTimeError);
      return;
    }

    const interviewerIds = data.interviewerIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id);

    const payload: CreateInterviewRequest = {
      applicationId,
      interviewType: data.interviewType,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
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
          <p className="text-sm text-muted-foreground">{t('interviewScheduleForm.applicant')}</p>
          <p className="font-medium">{applicantName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="interviewType">{t('interviewScheduleForm.interviewType')}</Label>
        <Controller
          control={control}
          name="interviewType"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPE_KEYS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(type.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">{t('interviewScheduleForm.date')}</Label>
          <Input
            id="scheduledDate"
            type="date"
            {...register('scheduledDate', { required: t('interviewScheduleForm.validation.dateRequired') })}
          />
          {errors.scheduledDate && (
            <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">{t('interviewScheduleForm.time')}</Label>
          <Input
            id="scheduledTime"
            type="time"
            {...register('scheduledTime', { required: t('interviewScheduleForm.validation.timeRequired') })}
          />
          {errors.scheduledTime && (
            <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="durationMinutes">{t('interviewScheduleForm.duration')}</Label>
        <Controller
          control={control}
          name="durationMinutes"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTION_KEYS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {t(opt.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {showLocation && (
        <div className="space-y-2">
          <Label htmlFor="location">{t('interviewScheduleForm.location')}</Label>
          <Input
            id="location"
            placeholder={t('interviewScheduleForm.locationPlaceholder')}
            {...register('location')}
          />
        </div>
      )}

      {showMeetingUrl && (
        <div className="space-y-2">
          <Label htmlFor="meetingUrl">{t('interviewScheduleForm.meetingUrl')}</Label>
          <Input
            id="meetingUrl"
            placeholder={t('interviewScheduleForm.meetingUrlPlaceholder')}
            {...register('meetingUrl')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="interviewerIds">{t('interviewScheduleForm.interviewerIds')}</Label>
        <Input
          id="interviewerIds"
          placeholder={t('interviewScheduleForm.interviewerIdsPlaceholder')}
          {...register('interviewerIds')}
        />
        <p className="text-xs text-muted-foreground">
          {t('interviewScheduleForm.interviewerIdsHelp')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('interviewScheduleForm.notes')}</Label>
        <Textarea
          id="notes"
          placeholder={t('interviewScheduleForm.notesPlaceholder')}
          rows={3}
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('interviewScheduleForm.submitButton')}
        </Button>
      </div>
    </form>
  );
}
