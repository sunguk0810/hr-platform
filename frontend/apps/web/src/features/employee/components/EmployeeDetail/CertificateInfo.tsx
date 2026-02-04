import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';

const certificateSchema = z.object({
  name: z.string().min(1, '자격증명은 필수입니다'),
  issuer: z.string().min(1, '발급기관은 필수입니다'),
  certificateNumber: z.string().optional(),
  issueDate: z.date({ required_error: '취득일은 필수입니다' }),
  expiryDate: z.date().optional(),
  grade: z.string().optional(),
  score: z.string().optional(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

export interface CertificateRecord {
  id: string;
  name: string;
  issuer: string;
  certificateNumber?: string;
  issueDate: Date;
  expiryDate?: Date;
  grade?: string;
  score?: string;
}

interface CertificateInfoProps {
  data?: CertificateRecord[];
  editable?: boolean;
  onAdd?: (certificate: CertificateFormData) => void;
  onUpdate?: (id: string, certificate: CertificateFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function CertificateInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: CertificateInfoProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<CertificateRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      name: '',
      issuer: '',
      certificateNumber: '',
      grade: '',
      score: '',
    },
  });

  const handleOpenDialog = (certificate?: CertificateRecord) => {
    if (certificate) {
      setEditingCertificate(certificate);
      form.reset({
        name: certificate.name,
        issuer: certificate.issuer,
        certificateNumber: certificate.certificateNumber || '',
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        grade: certificate.grade || '',
        score: certificate.score || '',
      });
    } else {
      setEditingCertificate(null);
      form.reset({
        name: '',
        issuer: '',
        certificateNumber: '',
        grade: '',
        score: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCertificate(null);
    form.reset();
  };

  const handleSubmit = (values: CertificateFormData) => {
    if (editingCertificate) {
      onUpdate?.(editingCertificate.id, values);
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

  const isExpired = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    return expiryDate < new Date();
  };

  const isExpiringSoon = (expiryDate?: Date) => {
    if (!expiryDate) return false;
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate > new Date() && expiryDate <= threeMonthsFromNow;
  };

  // Sort by issue date descending
  const sortedData = [...data].sort(
    (a, b) => b.issueDate.getTime() - a.issueDate.getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">자격증/어학</CardTitle>
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
            등록된 자격증/어학 정보가 없습니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedData.map((certificate) => {
              const expired = isExpired(certificate.expiryDate);
              const expiringSoon = isExpiringSoon(certificate.expiryDate);

              return (
                <div
                  key={certificate.id}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium truncate">
                          {certificate.name}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {certificate.issuer}
                        </p>
                      </div>
                      {editable && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenDialog(certificate)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteId(certificate.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(certificate.issueDate, 'yyyy.MM.dd')} 취득
                      </span>
                      {certificate.grade && (
                        <Badge variant="secondary" className="text-xs">
                          {certificate.grade}
                        </Badge>
                      )}
                      {certificate.score && (
                        <Badge variant="outline" className="text-xs">
                          {certificate.score}
                        </Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          만료됨
                        </Badge>
                      )}
                      {expiringSoon && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                          만료 임박
                        </Badge>
                      )}
                    </div>
                    {certificate.expiryDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        유효기간: {format(certificate.expiryDate, 'yyyy.MM.dd')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCertificate ? '자격증 수정' : '자격증 추가'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>자격증명 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="예: 정보처리기사, TOEIC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>발급기관 *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="certificateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>자격증 번호</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>취득일 *</FormLabel>
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
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>유효기간</FormLabel>
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
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>등급</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="예: 1급, 고급" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>점수</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="예: 900점" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
          title="자격증 삭제"
          description="선택한 자격증 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default CertificateInfo;
