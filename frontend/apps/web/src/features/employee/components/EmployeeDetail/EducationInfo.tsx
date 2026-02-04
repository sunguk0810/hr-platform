import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
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

const educationSchema = z.object({
  schoolType: z.string().min(1, '학교 구분은 필수입니다'),
  schoolName: z.string().min(1, '학교명은 필수입니다'),
  major: z.string().optional(),
  degree: z.string().optional(),
  enrollmentDate: z.date().optional(),
  graduationDate: z.date().optional(),
  graduationStatus: z.string().min(1, '졸업 상태는 필수입니다'),
  gpa: z.string().optional(),
  maxGpa: z.string().optional(),
});

type EducationFormData = z.infer<typeof educationSchema>;

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

const schoolTypeOptions = [
  { value: 'HIGH_SCHOOL', label: '고등학교' },
  { value: 'COLLEGE', label: '전문대학' },
  { value: 'UNIVERSITY', label: '대학교' },
  { value: 'GRADUATE', label: '대학원(석사)' },
  { value: 'DOCTORATE', label: '대학원(박사)' },
  { value: 'OTHER', label: '기타' },
];

const graduationStatusOptions = [
  { value: 'GRADUATED', label: '졸업' },
  { value: 'ENROLLED', label: '재학' },
  { value: 'LEAVE_OF_ABSENCE', label: '휴학' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'EXPECTED', label: '졸업예정' },
];

export function EducationInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: EducationInfoProps) {
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
    return schoolTypeOptions.find((opt) => opt.value === value)?.label || value;
  };

  const getGraduationStatusLabel = (value: string) => {
    return graduationStatusOptions.find((opt) => opt.value === value)?.label || value;
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
        <CardTitle className="text-lg">학력 사항</CardTitle>
        {editable && (
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-1 h-4 w-4" />
            추가
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            등록된 학력 사항이 없습니다.
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
                {editingEducation ? '학력 수정' : '학력 추가'}
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
                        <FormLabel>학교 구분 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schoolTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                        <FormLabel>학교명 *</FormLabel>
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
                        <FormLabel>전공</FormLabel>
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
                        <FormLabel>학위</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="예: 학사, 석사" />
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
                        <FormLabel>입학일</FormLabel>
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
                        <FormLabel>졸업일</FormLabel>
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
                        <FormLabel>졸업 상태 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {graduationStatusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                          <FormLabel>학점</FormLabel>
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
                          <FormLabel>만점</FormLabel>
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
                    취소
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? '저장 중...' : '저장'}
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
          title="학력 삭제"
          description="선택한 학력 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default EducationInfo;
