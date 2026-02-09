import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useIsMobile } from '@/hooks/useMediaQuery';
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

const CONTACT_CATEGORY_KEYS = [
  'account',
  'attendance',
  'approval',
  'organization',
  'system',
  'suggestion',
  'other',
] as const;

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
  const { t } = useTranslation('help');
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
        title: t('contact.toast.fileCountExceeded.title'),
        description: t('contact.toast.fileCountExceeded.description', { max: MAX_FILES }),
        variant: 'destructive',
      });
      return;
    }

    for (const file of Array.from(files)) {
      // 파일 크기 검사
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('contact.toast.fileSizeExceeded.title'),
          description: t('contact.toast.fileSizeExceeded.description', { filename: file.name }),
          variant: 'destructive',
        });
        continue;
      }

      // 파일 타입 검사
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: t('contact.toast.unsupportedFormat.title'),
          description: t('contact.toast.unsupportedFormat.description', { filename: file.name }),
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
            title: t('contact.toast.uploadFailed.title'),
            description: t('contact.toast.uploadFailed.description', { filename: file.name }),
            variant: 'destructive',
          });
        }
      } catch {
        // 에러 발생 시 제거
        setAttachments((prev) => prev.filter((att) => att.id !== tempId));
        toast({
          title: t('contact.toast.uploadFailed.title'),
          description: t('contact.toast.uploadFailed.description', { filename: file.name }),
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
        title: t('contact.toast.deleteFailed.title'),
        description: t('contact.toast.deleteFailed.description'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category || !form.subject || !form.message) {
      toast({
        title: t('contact.toast.validationError.title'),
        description: t('contact.toast.validationError.description'),
        variant: 'destructive',
      });
      return;
    }

    // 업로드 중인 파일이 있는지 확인
    if (attachments.some((att) => att.isUploading)) {
      toast({
        title: t('contact.toast.uploadInProgress.title'),
        description: t('contact.toast.uploadInProgress.description'),
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
          title: t('contact.toast.submitSuccess.title'),
          description: t('contact.toast.submitSuccess.description'),
        });
      } else {
        throw new Error('Submit failed');
      }
    } catch {
      toast({
        title: t('contact.toast.submitFailed.title'),
        description: t('contact.toast.submitFailed.description'),
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        {/* Mobile Header */}
        <div>
          <h1 className="text-xl font-bold">{t('contact.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('contact.mobileDescription')}</p>
        </div>

        {/* Quick Contact */}
        <div className="flex gap-3">
          <a
            href="mailto:hr-support@company.com"
            className="flex-1 bg-card rounded-xl border p-4 text-center"
          >
            <Mail className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('contact.directContact.email')}</p>
            <p className="text-sm font-medium">{t('contact.directContact.emailAction')}</p>
          </a>
          <a
            href="tel:02-1234-5678"
            className="flex-1 bg-card rounded-xl border p-4 text-center"
          >
            <Phone className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('contact.directContact.phone')}</p>
            <p className="text-sm font-medium">02-1234-5678</p>
          </a>
        </div>

        {/* Operating Hours */}
        <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">{t('contact.operatingHours.weekday')}</p>
            <p className="text-xs text-muted-foreground">{t('contact.operatingHours.lunchExcluded')}</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-card rounded-xl border p-4">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t('contact.submitted.title')}</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {t('contact.submitted.descriptionShort')}
              </p>
              <Button onClick={handleReset} size="sm">{t('contact.submitted.newInquiry')}</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('contact.form.title')}
              </h3>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{user?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{user?.departmentName || '-'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-category">{t('contact.form.categoryLabel')}</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value as ContactCategory })
                  }
                >
                  <SelectTrigger id="mobile-category">
                    <SelectValue placeholder={t('contact.form.categoryPlaceholderShort')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_CATEGORY_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`contact.categories.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-subject">{t('contact.form.subjectLabel')}</Label>
                <Input
                  id="mobile-subject"
                  placeholder={t('contact.form.subjectPlaceholderShort')}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-message">{t('contact.form.messageLabel')}</Label>
                <Textarea
                  id="mobile-message"
                  placeholder={t('contact.form.messagePlaceholder')}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>{t('contact.form.attachments')}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{att.filename}</span>
                          {att.isUploading && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
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
                  {t('contact.form.attachButton')}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t('contact.form.attachLimit', { max: MAX_FILES })}
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('contact.form.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('contact.form.submitButton')}
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('contact.title')}
        description={t('contact.description')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('contact.form.title')}
              </CardTitle>
              <CardDescription>
                {t('contact.form.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t('contact.submitted.title')}</h3>
                  <p className="mb-6 text-center text-muted-foreground whitespace-pre-line">
                    {t('contact.submitted.descriptionWithEmail')}
                  </p>
                  <Button onClick={handleReset}>{t('contact.submitted.newInquiry')}</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('contact.form.name')}</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.name || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('contact.form.department')}</Label>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.departmentName || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{t('contact.form.categoryLabel')}</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm({ ...form, category: value as ContactCategory })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder={t('contact.form.categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_CATEGORY_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`contact.categories.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('contact.form.subjectLabel')}</Label>
                    <Input
                      id="subject"
                      placeholder={t('contact.form.subjectPlaceholder')}
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.messageLabel')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('contact.form.messagePlaceholder')}
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  {/* 파일 첨부 영역 */}
                  <div className="space-y-2">
                    <Label>{t('contact.form.attachments')}</Label>
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
                        {t('contact.form.attachButton')}
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('contact.form.attachDescription', { max: MAX_FILES })}
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('contact.form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('contact.form.submitButton')}
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
              <CardTitle className="text-base">{t('contact.directContact.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('contact.directContact.email')}</p>
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
                  <p className="font-medium">{t('contact.directContact.phone')}</p>
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
              <CardTitle className="text-base">{t('contact.operatingHours.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">{t('contact.operatingHours.weekday')}</p>
                  <p className="text-muted-foreground">
                    ({t('contact.operatingHours.lunchExcluded')})
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    {t('contact.operatingHours.weekendClosed')}
                    <br />
                    {t('contact.operatingHours.urgentEmail')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contact.responseInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {t('contact.responseInfo.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
