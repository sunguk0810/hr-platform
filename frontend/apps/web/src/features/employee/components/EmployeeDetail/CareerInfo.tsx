import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/common/DatePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

const createCareerSchema = (t: TFunction) =>
  z.object({
    companyName: z.string().min(1, t('careerInfo.companyNameRequired')),
    department: z.string().optional(),
    position: z.string().optional(),
    startDate: z.date({ required_error: t('careerInfo.startDateRequired') }),
    endDate: z.date().optional(),
    isCurrent: z.boolean().default(false),
    jobDescription: z.string().optional(),
    resignationReason: z.string().optional(),
  });

type CareerFormData = z.infer<ReturnType<typeof createCareerSchema>>;

export interface CareerRecord {
  id: string;
  companyName: string;
  department?: string;
  position?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  jobDescription?: string;
  resignationReason?: string;
}

interface CareerInfoProps {
  data?: CareerRecord[];
  editable?: boolean;
  onAdd?: (career: CareerFormData) => void;
  onUpdate?: (id: string, career: CareerFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function CareerInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: CareerInfoProps) {
  const { t } = useTranslation('employee');
  const careerSchema = React.useMemo(() => createCareerSchema(t), [t]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CareerFormData>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      companyName: '',
      department: '',
      position: '',
      jobDescription: '',
      resignationReason: '',
      isCurrent: false,
    },
  });

  const handleOpenDialog = (career?: CareerRecord) => {
    if (career) {
      setEditingCareer(career);
      form.reset({
        companyName: career.companyName,
        department: career.department || '',
        position: career.position || '',
        startDate: career.startDate,
        endDate: career.endDate,
        isCurrent: career.isCurrent,
        jobDescription: career.jobDescription || '',
        resignationReason: career.resignationReason || '',
      });
    } else {
      setEditingCareer(null);
      form.reset({
        companyName: '',
        department: '',
        position: '',
        jobDescription: '',
        resignationReason: '',
        isCurrent: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCareer(null);
    form.reset();
  };

  const handleSubmit = (values: CareerFormData) => {
    if (editingCareer) {
      onUpdate?.(editingCareer.id, values);
    } else {
      onAdd?.(values);
    }
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete?.(deleteId);
      setDeleteId(null);
    }
  };

  // Sort by date descending
  const sortedData = [...data].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('careerInfo.title')}</CardTitle>
        {editable && (
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-1 h-4 w-4" />
            {t('common.add')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {t('careerInfo.empty')}
          </p>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />

            {sortedData.map((career) => (
              <div key={career.id} className="relative flex gap-4 pl-6">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-0 top-2 h-[14px] w-[14px] rounded-full border-2 border-background',
                    career.isCurrent ? 'bg-primary' : 'bg-muted-foreground'
                  )}
                />

                <div className="flex-1 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{career.companyName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {[career.department, career.position]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(career.startDate, 'yyyy.MM')} ~{' '}
                        {career.isCurrent
                          ? t('common.present')
                          : career.endDate
                          ? format(career.endDate, 'yyyy.MM')
                          : ''}
                      </span>
                      {editable && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(career)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteId(career.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {career.jobDescription && (
                    <p className="mt-2 text-sm">{career.jobDescription}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCareer ? t('careerInfo.editDialog') : t('careerInfo.addDialog')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('careerInfo.companyName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('careerInfo.department')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('careerInfo.position')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('careerInfo.startDate')}</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('careerInfo.endDate')}</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={form.watch('isCurrent')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('careerInfo.jobDescription')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resignationReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('careerInfo.resignationReason')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={t('careerInfo.deleteTitle')}
          description={t('careerInfo.deleteDescription')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default CareerInfo;
