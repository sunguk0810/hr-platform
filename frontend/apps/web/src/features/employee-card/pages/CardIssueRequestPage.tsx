import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCreateCardIssueRequest } from '../hooks/useEmployeeCard';
import type { CardIssueType } from '@hr-platform/shared-types';
import { CARD_ISSUE_TYPE_LABELS } from '@hr-platform/shared-types';

const createCardIssueSchema = (t: TFunction) => z.object({
  issueType: z.enum(['NEW', 'REISSUE', 'RENEWAL'] as const, {
    required_error: t('issueValidation.typeRequired'),
  }),
  reason: z.string().min(1, t('issueValidation.reasonRequired')).max(500),
});

type CardIssueFormData = z.infer<ReturnType<typeof createCardIssueSchema>>;

export default function CardIssueRequestPage() {
  const { t } = useTranslation('employeeCard');
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateCardIssueRequest();

  const cardIssueSchema = useMemo(() => createCardIssueSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CardIssueFormData>({
    resolver: zodResolver(cardIssueSchema),
    defaultValues: {
      issueType: 'NEW',
      reason: '',
    },
  });

  const onSubmit = async (data: CardIssueFormData) => {
    try {
      await createMutation.mutateAsync({
        employeeId: '',
        issueType: data.issueType,
        reason: data.reason,
      });

      toast({
        title: t('issueToast.success'),
        description: t('issueToast.successDesc'),
      });

      navigate('/employee-card');
    } catch {
      toast({
        title: t('issueToast.failed'),
        description: t('issueToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending;

  return (
    <>
      <PageHeader
        title={t('issueRequest.title')}
        description={t('issueRequest.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              {t('issueSection.title')}
            </CardTitle>
            <CardDescription>{t('issueSection.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">{t('issueSection.typeLabel')}</Label>
              <Controller
                name="issueType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="issueType">
                      <SelectValue placeholder={t('issueSection.typeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CARD_ISSUE_TYPE_LABELS) as [CardIssueType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.issueType && (
                <p className="text-sm text-destructive">{errors.issueType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">{t('issueSection.reasonLabel')}</Label>
              <Textarea
                id="reason"
                {...register('reason')}
                placeholder={t('issueSection.reasonPlaceholder')}
                rows={6}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/employee-card')}
            disabled={isPending}
          >
            {t('buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('buttons.apply')}
          </Button>
        </div>
      </form>
    </>
  );
}
