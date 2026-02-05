import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const CATEGORY_OPTIONS = [
  { value: 'NOTICE', label: '공지' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'UPDATE', label: '업데이트' },
  { value: 'URGENT', label: '긴급' },
] as const;

const announcementSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요').max(10000),
  category: z.enum(['NOTICE', 'EVENT', 'UPDATE', 'URGENT'], {
    required_error: '분류를 선택해주세요',
  }),
  isPinned: z.boolean().default(false),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AnnouncementCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const isEditMode = !!id;

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
          title: '수정 완료',
          description: '공지사항이 수정되었습니다.',
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: '등록 완료',
          description: '공지사항이 등록되었습니다.',
        });
      }

      navigate('/announcements');
    } catch {
      toast({
        title: isEditMode ? '수정 실패' : '등록 실패',
        description: '공지사항 처리 중 오류가 발생했습니다.',
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
        title={isEditMode ? '공지사항 수정' : '공지사항 작성'}
        description={isEditMode ? '공지사항을 수정합니다.' : '새로운 공지사항을 작성합니다.'}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
              공지사항 정보
            </CardTitle>
            <CardDescription>공지사항의 제목과 내용을 입력합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">분류 *</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="분류 선택" />
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
                <Label htmlFor="isPinned">상단 고정</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="공지사항 제목을 입력하세요"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="공지사항 내용을 입력하세요"
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
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isEditMode ? '수정' : '등록'}
          </Button>
        </div>
      </form>
    </>
  );
}
