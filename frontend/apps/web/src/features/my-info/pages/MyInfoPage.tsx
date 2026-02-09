import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Edit,
  Camera,
  Loader2,
  Trash2,
  ClipboardList,
  SendHorizonal,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { profileService, type UpdateProfileRequest, type UserProfile } from '../services/profileService';
import {
  changeRequestService,
  CATEGORY_OPTIONS,
  type ChangeRequestCategory,
} from '../services/changeRequestService';

export default function MyInfoPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangeRequestDialogOpen, setIsChangeRequestDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    mobile: '',
    email: '',
    nameEn: '',
  });

  // Change request form state
  const [changeRequestForm, setChangeRequestForm] = useState({
    category: '' as ChangeRequestCategory | '',
    fieldName: '',
    oldValue: '',
    newValue: '',
    reason: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await profileService.getMyProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch {
        if (user) {
          setProfile({
            id: user.id,
            employeeNumber: user.employeeNumber || '',
            name: user.name,
            email: user.email,
            departmentId: '',
            departmentName: user.departmentName || '',
            positionName: user.positionName,
            gradeName: user.gradeName,
            profileImageUrl: user.profileImageUrl,
            hireDate: '',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const response = await changeRequestService.getChangeRequests('PENDING');
        if (response.success && response.data) {
          setPendingRequestCount(response.data.length);
        }
      } catch {
        // Silently fail - non-critical
      }
    };

    loadPendingCount();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditOpen = () => {
    setFormData({
      email: profile?.email || user?.email || '',
      mobile: profile?.mobile || '',
      nameEn: profile?.nameEn || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await profileService.updateMyProfile(formData);

      if (response.success && response.data) {
        setProfile(response.data);

        if (user) {
          setUser({
            ...user,
            email: response.data.email,
          });
        }

        toast({
          title: t('myInfo.toast.saveSuccess'),
          description: t('myInfo.toast.saveSuccessDesc'),
        });
        setIsEditDialogOpen(false);
      }
    } catch {
      toast({
        title: t('myInfo.toast.saveFailed'),
        description: t('myInfo.toast.saveFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRequestOpen = () => {
    setChangeRequestForm({
      category: '',
      fieldName: '',
      oldValue: '',
      newValue: '',
      reason: '',
    });
    setIsChangeRequestDialogOpen(true);
  };

  const handleChangeRequestSubmit = async () => {
    if (
      !changeRequestForm.category ||
      !changeRequestForm.fieldName ||
      !changeRequestForm.newValue ||
      !changeRequestForm.reason
    ) {
      toast({
        title: t('myInfo.toast.inputError'),
        description: t('myInfo.toast.inputErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changeRequestService.createChangeRequest({
        category: changeRequestForm.category as ChangeRequestCategory,
        fieldName: changeRequestForm.fieldName,
        oldValue: changeRequestForm.oldValue,
        newValue: changeRequestForm.newValue,
        reason: changeRequestForm.reason,
      });

      if (response.success) {
        setPendingRequestCount((prev) => prev + 1);
        toast({
          title: t('myInfo.toast.changeRequestSuccess'),
          description: t('myInfo.toast.changeRequestSuccessDesc'),
        });
        setIsChangeRequestDialogOpen(false);
      }
    } catch {
      toast({
        title: t('myInfo.toast.changeRequestFailed'),
        description: t('myInfo.toast.changeRequestFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('myInfo.toast.fileSizeExceeded'),
        description: t('myInfo.toast.fileSizeExceededDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('myInfo.toast.fileTypeError'),
        description: t('myInfo.toast.fileTypeErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const response = await profileService.uploadProfilePhoto(file);

      if (response.success && response.data) {
        const newImageUrl = response.data.url;

        if (profile) {
          setProfile({ ...profile, profileImageUrl: newImageUrl });
        }

        if (user) {
          setUser({ ...user, profileImageUrl: newImageUrl });
        }

        toast({
          title: t('myInfo.toast.uploadSuccess'),
          description: t('myInfo.toast.uploadSuccessDesc'),
        });
      }
    } catch {
      toast({
        title: t('myInfo.toast.uploadFailed'),
        description: t('myInfo.toast.uploadFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await profileService.deleteProfilePhoto();

      if (profile) {
        setProfile({ ...profile, profileImageUrl: undefined });
      }

      if (user) {
        setUser({ ...user, profileImageUrl: undefined });
      }

      toast({
        title: t('myInfo.toast.deleteSuccess'),
        description: t('myInfo.toast.deleteSuccessDesc'),
      });
    } catch {
      toast({
        title: t('myInfo.toast.deleteFailed'),
        description: t('myInfo.toast.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const displayProfile = profile || user;
  const displayName = displayProfile?.name || '';
  const displayEmail = profile?.email || user?.email || '-';
  const displayMobile = profile?.mobile || '-';
  const displayDepartment = profile?.departmentName || user?.departmentName || '-';
  const displayEmployeeNumber = profile?.employeeNumber || user?.employeeNumber || '-';
  const displayHireDate = profile?.hireDate ? new Date(profile.hireDate).toLocaleDateString('ko-KR') : '-';
  const displayPosition = profile?.positionName || user?.positionName || '';
  const displayGrade = profile?.gradeName || user?.gradeName || '';
  const displayProfileImage = profile?.profileImageUrl || user?.profileImageUrl;

  if (isLoading) {
    return (
      <>
        {!isMobile && (
          <PageHeader
            title={t('myInfo.title')}
            description={t('myInfo.description')}
          />
        )}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-4 pb-20">
          {/* Mobile Profile Header */}
          <div className="bg-card rounded-2xl border p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={displayProfileImage} alt={displayName} />
                  <AvatarFallback className="text-xl">
                    {displayName ? getInitials(displayName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={isUploadingPhoto}
                  className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:bg-primary/90 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <h2 className="mt-3 text-lg font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">
                {displayPosition && displayGrade
                  ? `${displayPosition} / ${displayGrade}`
                  : displayPosition || displayGrade || '-'}
              </p>
              <p className="text-sm text-muted-foreground">{displayDepartment}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditOpen}
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  {t('myInfo.editContact')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeRequestOpen}
                >
                  <SendHorizonal className="mr-1.5 h-3.5 w-3.5" />
                  {t('myInfo.changeRequest')}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Info List */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <MobileInfoItem icon={Mail} label={t('myInfo.email')} value={displayEmail} />
            <MobileInfoItem icon={Phone} label={t('myInfo.phone')} value={displayMobile} />
            <MobileInfoItem icon={Building2} label={t('myInfo.department')} value={displayDepartment} />
            <MobileInfoItem icon={Briefcase} label={t('myInfo.employeeNumber')} value={displayEmployeeNumber} />
            <MobileInfoItem icon={Calendar} label={t('myInfo.hireDate')} value={displayHireDate} isLast />
          </div>

          {/* Change Request Status Link */}
          <button
            type="button"
            className="w-full bg-card rounded-2xl border p-4 flex items-center justify-between active:bg-accent"
            onClick={() => navigate('/my-info/change-requests')}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">{t('myInfo.changeRequestStatus')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('myInfo.changeRequestHistory')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingRequestCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="mr-1 h-3 w-3" />
                  {t('myInfo.pendingCount', { count: pendingRequestCount })}
                </Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* Photo Delete */}
          {displayProfileImage && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleDeletePhoto}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('myInfo.deletePhoto')}
            </Button>
          )}
        </div>

        {/* Edit Dialog (Immediate - Contact Info) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t('myInfo.editDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('myInfo.editDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile-email">{t('myInfo.editDialog.email')}</Label>
                <Input
                  id="mobile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="example@company.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile-phone">{t('myInfo.editDialog.phone')}</Label>
                <Input
                  id="mobile-phone"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                  }
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile-nameEn">{t('myInfo.editDialog.nameEn')}</Label>
                <Input
                  id="mobile-nameEn"
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                  }
                  placeholder="Hong Gildong"
                />
              </div>
            </div>
            <DialogFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('myInfo.editDialog.saving')}
                  </>
                ) : (
                  tCommon('save')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Request Dialog (Approval Required) */}
        <ChangeRequestDialog
          open={isChangeRequestDialogOpen}
          onOpenChange={setIsChangeRequestDialogOpen}
          form={changeRequestForm}
          setForm={setChangeRequestForm}
          onSubmit={handleChangeRequestSubmit}
          isSubmitting={isSubmitting}
          isMobile={true}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('myInfo.title')}
        description={t('myInfo.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleChangeRequestOpen}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              {t('myInfo.changeRequest')}
            </Button>
            <Button onClick={handleEditOpen}>
              <Edit className="mr-2 h-4 w-4" />
              {t('myInfo.editContact')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center pt-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayProfileImage} alt={displayName} />
                <AvatarFallback className="text-2xl">
                  {displayName ? getInitials(displayName) : 'U'}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <h2 className="mt-4 text-xl font-semibold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {displayPosition && displayGrade
                ? `${displayPosition} / ${displayGrade}`
                : displayPosition || displayGrade || '-'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayDepartment}
            </p>

            {displayProfileImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePhoto}
                className="mt-3 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {t('myInfo.deletePhotoShort')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('myInfo.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('myInfo.email')}</p>
                  <p className="font-medium">{displayEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('myInfo.phone')}</p>
                  <p className="font-medium">{displayMobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('myInfo.department')}</p>
                  <p className="font-medium">{displayDepartment}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('myInfo.employeeNumber')}</p>
                  <p className="font-medium">{displayEmployeeNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('myInfo.hireDate')}</p>
                  <p className="font-medium">{displayHireDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Request Status Section */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">{t('myInfo.changeRequestStatus')}</CardTitle>
              {pendingRequestCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="mr-1 h-3 w-3" />
                  {t('myInfo.pendingCountDesktop', { count: pendingRequestCount })}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-info/change-requests')}
            >
              {t('myInfo.viewAll')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('myInfo.changeRequestDescription')}
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog (Immediate - Contact Info) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('myInfo.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('myInfo.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('myInfo.editDialog.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="example@company.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">{t('myInfo.editDialog.phone')}</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                }
                placeholder="010-0000-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{t('myInfo.editDialog.nameEn')}</Label>
              <Input
                id="nameEn"
                type="text"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                }
                placeholder="Hong Gildong"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('myInfo.editDialog.saving')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Request Dialog (Approval Required) */}
      <ChangeRequestDialog
        open={isChangeRequestDialogOpen}
        onOpenChange={setIsChangeRequestDialogOpen}
        form={changeRequestForm}
        setForm={setChangeRequestForm}
        onSubmit={handleChangeRequestSubmit}
        isSubmitting={isSubmitting}
        isMobile={false}
      />
    </>
  );
}

// ========= Sub Components =========

// Mobile Info Item Component
interface MobileInfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isLast?: boolean;
}

function MobileInfoItem({ icon: Icon, label, value, isLast }: MobileInfoItemProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b' : ''}`}>
      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// Change Request Dialog Component
interface ChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    category: ChangeRequestCategory | '';
    fieldName: string;
    oldValue: string;
    newValue: string;
    reason: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      category: ChangeRequestCategory | '';
      fieldName: string;
      oldValue: string;
      newValue: string;
      reason: string;
    }>
  >;
  onSubmit: () => void;
  isSubmitting: boolean;
  isMobile: boolean;
}

function ChangeRequestDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isSubmitting,
  isMobile,
}: ChangeRequestDialogProps) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? 'max-w-[calc(100%-2rem)] rounded-2xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>{t('myInfo.changeRequestDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('myInfo.changeRequestDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cr-category">
              {t('myInfo.changeRequestDialog.category')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  category: value as ChangeRequestCategory,
                }))
              }
            >
              <SelectTrigger id="cr-category">
                <SelectValue placeholder={t('myInfo.changeRequestDialog.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(`myInfo.changeRequestDialog.categories.${opt.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-fieldName">
              {t('myInfo.changeRequestDialog.fieldName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cr-fieldName"
              value={form.fieldName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fieldName: e.target.value }))
              }
              placeholder={t('myInfo.changeRequestDialog.fieldNamePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-oldValue">{t('myInfo.changeRequestDialog.oldValue')}</Label>
            <Input
              id="cr-oldValue"
              value={form.oldValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, oldValue: e.target.value }))
              }
              placeholder={t('myInfo.changeRequestDialog.oldValuePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-newValue">
              {t('myInfo.changeRequestDialog.newValue')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cr-newValue"
              value={form.newValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newValue: e.target.value }))
              }
              placeholder={t('myInfo.changeRequestDialog.newValuePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-reason">
              {t('myInfo.changeRequestDialog.reason')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cr-reason"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder={t('myInfo.changeRequestDialog.reasonPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className={isMobile ? 'flex-row gap-2' : undefined}>
          <Button
            variant="outline"
            className={isMobile ? 'flex-1' : undefined}
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            className={isMobile ? 'flex-1' : undefined}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('myInfo.changeRequestDialog.submitting')}
              </>
            ) : (
              <>
                <SendHorizonal className="mr-2 h-4 w-4" />
                {t('myInfo.changeRequestDialog.submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
