import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '../hooks/useAnnouncements';

const createAnnouncementSchema = (t: TFunction) => z.object({
  title: z.string().min(1, t('validation.titleRequired')).max(200),
  content: z.string().min(1, t('validation.contentRequired')).max(10000),
  category: z.enum(['NOTICE', 'EVENT', 'UPDATE', 'URGENT'], {
    required_error: t('validation.categoryRequired'),
  }),
  isPinned: z.boolean().default(false),
});

type AnnouncementFormData = z.infer<ReturnType<typeof createAnnouncementSchema>>;

export default function AnnouncementCreatePage() {
  const { t } = useTranslation('announcement');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const isEditMode = !!id;

  const CATEGORY_OPTIONS = useMemo(() => [
    { value: 'NOTICE', label: t('categories.NOTICE') },
    { value: 'EVENT', label: t('categories.EVENT') },
    { value: 'UPDATE', label: t('categories.UPDATE') },
    { value: 'URGENT', label: t('categories.URGENT') },
  ] as const, [t]);

  const announcementSchema = useMemo(() => createAnnouncementSchema(t), [t]);

  const { data: announcementData, isLoading: isLoadingDetail } = useAnnouncement(id || '');
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'NOTICE',
      isPinned: false,
    },
  });

  useEffect(() => {
    if (isEditMode && announcementData?.data) {
      const data = announcementData.data;
      reset({
        title: data.title,
        content: data.content,
        category: data.category,
        isPinned: data.isPinned,
      });
    }
  }, [isEditMode, announcementData, reset]);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data });
        toast({
          title: t('toast.updateSuccess'),
          description: t('toast.updateSuccessDesc'),
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: t('toast.createSuccess'),
          description: t('toast.createSuccessDesc'),
        });
      }

      navigate('/announcements');
    } catch {
      toast({
        title: isEditMode ? t('toast.updateFailed') : t('toast.createFailed'),
        description: t('toast.processFailed'),
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isEditMode ? t('editPage.title') : t('createPage.title')}
        description={isEditMode ? t('editPage.description') : t('createPage.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
              {t('section.info')}
            </CardTitle>
            <CardDescription>{t('section.infoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">{t('labels.category')}</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder={t('labels.categorySelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Controller
                  name="isPinned"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isPinned"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isPinned">{t('labels.pinned')}</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t('labels.title')}</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder={t('labels.titlePlaceholder')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t('labels.content')}</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder={t('labels.contentPlaceholder')}
                rows={15}
                className="min-h-[300px]"
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/announcements')}
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
            {isEditMode ? t('buttons.edit') : t('buttons.create')}
          </Button>
        </div>
      </form>
    </>
  );
}
