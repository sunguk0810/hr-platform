import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const SCHOOL_TYPE_KEYS = ['HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'GRADUATE', 'DOCTORATE', 'OTHER'] as const;

const GRADUATION_STATUS_KEYS = ['GRADUATED', 'ENROLLED', 'LEAVE_OF_ABSENCE', 'DROPPED_OUT', 'EXPECTED'] as const;

const createEducationSchema = (t: TFunction) =>
  z.object({
    schoolType: z.string().min(1, t('educationInfo.schoolTypeRequired')),
    schoolName: z.string().min(1, t('educationInfo.schoolNameRequired')),
    major: z.string().optional(),
    degree: z.string().optional(),
    enrollmentDate: z.date().optional(),
    graduationDate: z.date().optional(),
    graduationStatus: z.string().min(1, t('educationInfo.graduationStatusRequired')),
    gpa: z.string().optional(),
    maxGpa: z.string().optional(),
  });

type EducationFormData = z.infer<ReturnType<typeof createEducationSchema>>;

export interface EducationRecord {
  id: string;
  schoolType: string;
  schoolName: string;
  major?: string;
  degree?: string;
  enrollmentDate?: Date;
  graduationDate?: Date;
  graduationStatus: string;
  gpa?: string;
  maxGpa?: string;
}

interface EducationInfoProps {
  data?: EducationRecord[];
  editable?: boolean;
  onAdd?: (education: EducationFormData) => void;
  onUpdate?: (id: string, education: EducationFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function EducationInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: EducationInfoProps) {
  const { t } = useTranslation('employee');
  const educationSchema = React.useMemo(() => createEducationSchema(t), [t]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<EducationRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      schoolType: '',
      schoolName: '',
      major: '',
      degree: '',
      graduationStatus: '',
      gpa: '',
      maxGpa: '',
    },
  });

  const handleOpenDialog = (education?: EducationRecord) => {
    if (education) {
      setEditingEducation(education);
      form.reset({
        schoolType: education.schoolType,
        schoolName: education.schoolName,
        major: education.major || '',
        degree: education.degree || '',
        enrollmentDate: education.enrollmentDate,
        graduationDate: education.graduationDate,
        graduationStatus: education.graduationStatus,
        gpa: education.gpa || '',
        maxGpa: education.maxGpa || '',
      });
    } else {
      setEditingEducation(null);
      form.reset({
        schoolType: '',
        schoolName: '',
        major: '',
        degree: '',
        graduationStatus: '',
        gpa: '',
        maxGpa: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEducation(null);
    form.reset();
  };

  const handleSubmit = (values: EducationFormData) => {
    if (editingEducation) {
      onUpdate?.(editingEducation.id, values);
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

  const getSchoolTypeLabel = (value: string) => {
    return t(`educationInfo.schoolTypeOptions.${value}`, value);
  };

  const getGraduationStatusLabel = (value: string) => {
    return t(`educationInfo.graduationStatusOptions.${value}`, value);
  };

  // Sort by graduation date descending
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.graduationDate?.getTime() || 0;
    const dateB = b.graduationDate?.getTime() || 0;
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('educationInfo.title')}</CardTitle>
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
            {t('educationInfo.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {sortedData.map((education) => (
              <div
                key={education.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{education.schoolName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getSchoolTypeLabel(education.schoolType)}
                        {education.major && ` · ${education.major}`}
                        {education.degree && ` · ${education.degree}`}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0 ml-2">
                      {education.enrollmentDate &&
                        format(education.enrollmentDate, 'yyyy.MM')}{' '}
                      ~{' '}
                      {education.graduationDate &&
                        format(education.graduationDate, 'yyyy.MM')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">
                      {getGraduationStatusLabel(education.graduationStatus)}
                    </span>
                    {education.gpa && (
                      <span className="text-muted-foreground">
                        GPA: {education.gpa}
                        {education.maxGpa && ` / ${education.maxGpa}`}
                      </span>
                    )}
                  </div>
                </div>
                {editable && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(education)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteId(education.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEducation ? t('educationInfo.editDialog') : t('educationInfo.addDialog')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="schoolType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.schoolType')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('common.selectPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCHOOL_TYPE_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`educationInfo.schoolTypeOptions.${key}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.schoolName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="major"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.major')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.degree')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('educationInfo.degreePlaceholder')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enrollmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.enrollmentDate')}</FormLabel>
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
                    name="graduationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.graduationDate')}</FormLabel>
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
                    name="graduationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('educationInfo.graduationStatus')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('common.selectPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADUATION_STATUS_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`educationInfo.graduationStatusOptions.${key}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="gpa"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('educationInfo.gpa')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="3.5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxGpa"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t('educationInfo.maxGpa')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="4.5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
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
          title={t('educationInfo.deleteTitle')}
          description={t('educationInfo.deleteDescription')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default EducationInfo;
