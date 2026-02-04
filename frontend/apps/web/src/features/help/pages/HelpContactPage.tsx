import { useState, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  Building,
  User,
  CheckCircle,
  Paperclip,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  helpService,
  type ContactCategory,
} from '../services/helpService';

interface ContactForm {
  category: ContactCategory | '';
  subject: string;
  message: string;
}

interface AttachmentItem {
  id: string;
  filename: string;
  size: number;
  isUploading?: boolean;
}

const contactCategories = [
  { value: 'account', label: '계정 문의' },
  { value: 'attendance', label: '근태/휴가 문의' },
  { value: 'approval', label: '결재 문의' },
  { value: 'organization', label: '조직/인사 문의' },
  { value: 'system', label: '시스템 오류' },
  { value: 'suggestion', label: '개선 제안' },
  { value: 'other', label: '기타' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function HelpContactPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState<ContactForm>({
    category: '',
    subject: '',
    message: '',
  });
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 파일 개수 제한
    if (attachments.length + files.length > MAX_FILES) {
      toast({
        title: '파일 개수 초과',
        description: `최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`,
        variant: 'destructive',
      });
      return;
    }

    for (const file of Array.from(files)) {
      // 파일 크기 검사
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: '파일 크기 초과',
          description: `${file.name}의 크기가 10MB를 초과합니다.`,
          variant: 'destructive',
        });
        continue;
      }

      // 파일 타입 검사
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: '지원하지 않는 형식',
          description: `${file.name}은 지원하지 않는 파일 형식입니다.`,
          variant: 'destructive',
        });
        continue;
      }

      // 임시 ID로 업로드 중 상태 추가
      const tempId = `temp-${Date.now()}-${file.name}`;
      setAttachments((prev) => [
        ...prev,
        { id: tempId, filename: file.name, size: file.size, isUploading: true },
      ]);

      try {
        const response = await helpService.uploadAttachment(file);

        if (response.success && response.data) {
          // 업로드 완료 후 실제 데이터로 교체
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === tempId
                ? {
                    id: response.data.id,
                    filename: response.data.filename,
                    size: response.data.size,
                    isUploading: false,
                  }
                : att
            )
          );
        } else {
          // 업로드 실패 시 제거
          setAttachments((prev) => prev.filter((att) => att.id !== tempId));
          toast({
            title: '업로드 실패',
            description: `${file.name} 업로드에 실패했습니다.`,
            variant: 'destructive',
          });
        }
      } catch {
        // 에러 발생 시 제거
        setAttachments((prev) => prev.filter((att) => att.id !== tempId));
        toast({
          title: '업로드 실패',
          description: `${file.name} 업로드에 실패했습니다.`,
          variant: 'destructive',
        });
      }
    }

    // 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (id: string) => {
    const attachment = attachments.find((att) => att.id === id);
    if (!attachment) return;

    // 업로드 중인 파일은 바로 제거
    if (attachment.isUploading || id.startsWith('temp-')) {
      setAttachments((prev) => prev.filter((att) => att.id !== id));
      return;
    }

    try {
      await helpService.deleteAttachment(id);
      setAttachments((prev) => prev.filter((att) => att.id !== id));
    } catch {
      toast({
        title: '삭제 실패',
        description: '첨부파일 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category || !form.subject || !form.message) {
      toast({
        title: '입력 오류',
        description: '모든 필드를 입력해 주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 업로드 중인 파일이 있는지 확인
    if (attachments.some((att) => att.isUploading)) {
      toast({
        title: '업로드 진행 중',
        description: '파일 업로드가 완료된 후 제출해 주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await helpService.submitInquiry({
        category: form.category as ContactCategory,
        subject: form.subject,
        message: form.message,
        attachments: attachments.map((att) => att.id),
      });

      if (response.success) {
        setIsSubmitted(true);
        toast({
          title: '문의가 접수되었습니다',
          description: '담당자가 확인 후 빠른 시일 내에 답변드리겠습니다.',
        });
      } else {
        throw new Error('Submit failed');
      }
    } catch {
      toast({
        title: '문의 접수 실패',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setForm({ category: '', subject: '', message: '' });
    setAttachments([]);
  };

  return (
    <>
      <PageHeader
        title="문의하기"
        description="궁금한 점이나 요청사항을 남겨주세요."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                문의 작성
              </CardTitle>
              <CardDescription>
                문의 내용을 작성해 주시면 담당자가 확인 후 답변드립니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">문의가 접수되었습니다</h3>
                  <p className="mb-6 text-center text-muted-foreground">
                    담당자가 확인 후 빠른 시일 내에 답변드리겠습니다.
                    <br />
                    답변은 등록된 이메일로 발송됩니다.
                  </p>
                  <Button onClick={handleReset}>새 문의 작성</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>이름</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.name || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>소속</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.departmentName || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">문의 유형 *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm({ ...form, category: value as ContactCategory })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="문의 유형을 선택해 주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">제목 *</Label>
                    <Input
                      id="subject"
                      placeholder="문의 제목을 입력해 주세요"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">문의 내용 *</Label>
                    <Textarea
                      id="message"
                      placeholder="문의 내용을 상세히 입력해 주세요"
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  {/* 파일 첨부 영역 */}
                  <div className="space-y-2">
                    <Label>첨부파일</Label>
                    <div className="rounded-md border border-dashed p-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_FILE_TYPES.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {attachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between rounded bg-muted/50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{att.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatFileSize(att.size)})
                                </span>
                                {att.isUploading && (
                                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachments.length >= MAX_FILES}
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        파일 첨부
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        이미지, PDF, Word, Excel 파일 (최대 10MB, {MAX_FILES}개까지)
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        접수 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        문의 접수
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">직접 연락하기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">이메일</p>
                  <a
                    href="mailto:hr-support@company.com"
                    className="text-sm text-primary hover:underline"
                  >
                    hr-support@company.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">전화</p>
                  <a
                    href="tel:02-1234-5678"
                    className="text-sm text-primary hover:underline"
                  >
                    02-1234-5678
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">운영 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">평일 09:00 - 18:00</p>
                  <p className="text-muted-foreground">
                    (점심시간 12:00 - 13:00 제외)
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    주말 및 공휴일은 휴무입니다.
                    <br />
                    긴급 문의는 이메일로 남겨주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">답변 안내</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                문의 접수 후 영업일 기준 1-2일 이내에 답변드립니다.
                답변은 등록된 회사 이메일로 발송되며, 알림 센터에서도 확인하실 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
