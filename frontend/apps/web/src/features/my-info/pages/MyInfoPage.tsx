import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // 프로필 정보 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await profileService.getMyProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch {
        // API 미연동 시 authStore의 user 정보 사용
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

  // 대기 중인 변경 요청 건수 로드
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

        // authStore의 user 정보도 업데이트
        if (user) {
          setUser({
            ...user,
            email: response.data.email,
          });
        }

        toast({
          title: '저장 완료',
          description: '연락처 정보가 수정되었습니다.',
        });
        setIsEditDialogOpen(false);
      }
    } catch {
      toast({
        title: '저장 실패',
        description: '정보 수정 중 오류가 발생했습니다.',
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
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
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
          title: '변경 요청 완료',
          description: '변경 요청이 등록되었습니다. HR 담당자의 승인을 기다려주세요.',
        });
        setIsChangeRequestDialogOpen(false);
      }
    } catch {
      toast({
        title: '요청 실패',
        description: '변경 요청 중 오류가 발생했습니다.',
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

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '파일 크기 초과',
        description: '프로필 사진은 5MB 이하만 업로드 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    // 이미지 타입 확인
    if (!file.type.startsWith('image/')) {
      toast({
        title: '파일 형식 오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const response = await profileService.uploadProfilePhoto(file);

      if (response.success && response.data) {
        const newImageUrl = response.data.url;

        // 프로필 상태 업데이트
        if (profile) {
          setProfile({ ...profile, profileImageUrl: newImageUrl });
        }

        // authStore의 user 정보도 업데이트
        if (user) {
          setUser({ ...user, profileImageUrl: newImageUrl });
        }

        toast({
          title: '업로드 완료',
          description: '프로필 사진이 변경되었습니다.',
        });
      }
    } catch {
      toast({
        title: '업로드 실패',
        description: '프로필 사진 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
      // 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await profileService.deleteProfilePhoto();

      // 프로필 상태 업데이트
      if (profile) {
        setProfile({ ...profile, profileImageUrl: undefined });
      }

      // authStore의 user 정보도 업데이트
      if (user) {
        setUser({ ...user, profileImageUrl: undefined });
      }

      toast({
        title: '삭제 완료',
        description: '프로필 사진이 삭제되었습니다.',
      });
    } catch {
      toast({
        title: '삭제 실패',
        description: '프로필 사진 삭제 중 오류가 발생했습니다.',
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
            title="내 정보"
            description="개인 정보 및 근무 정보를 확인하고 관리합니다."
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
                  연락처 수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeRequestOpen}
                >
                  <SendHorizonal className="mr-1.5 h-3.5 w-3.5" />
                  변경 요청
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Info List */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <MobileInfoItem icon={Mail} label="이메일" value={displayEmail} />
            <MobileInfoItem icon={Phone} label="연락처" value={displayMobile} />
            <MobileInfoItem icon={Building2} label="부서" value={displayDepartment} />
            <MobileInfoItem icon={Briefcase} label="사번" value={displayEmployeeNumber} />
            <MobileInfoItem icon={Calendar} label="입사일" value={displayHireDate} isLast />
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
                <p className="text-sm font-medium">변경 요청 현황</p>
                <p className="text-xs text-muted-foreground">
                  내 정보 변경 요청 이력 확인
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingRequestCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="mr-1 h-3 w-3" />
                  {pendingRequestCount}건 대기
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
              프로필 사진 삭제
            </Button>
          )}
        </div>

        {/* Edit Dialog (Immediate - Contact Info) */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl">
            <DialogHeader>
              <DialogTitle>연락처 정보 수정</DialogTitle>
              <DialogDescription>
                연락처 정보는 즉시 반영됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile-email">이메일</Label>
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
                <Label htmlFor="mobile-phone">연락처</Label>
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
                <Label htmlFor="mobile-nameEn">영문명</Label>
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
                취소
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
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
        title="내 정보"
        description="개인 정보 및 근무 정보를 확인하고 관리합니다."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleChangeRequestOpen}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              변경 요청
            </Button>
            <Button onClick={handleEditOpen}>
              <Edit className="mr-2 h-4 w-4" />
              연락처 수정
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

              {/* 프로필 사진 변경 버튼 */}
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

            {/* 프로필 사진 삭제 버튼 */}
            {displayProfileImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePhoto}
                className="mt-3 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                사진 삭제
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="font-medium">{displayEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{displayMobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{displayDepartment}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">사번</p>
                  <p className="font-medium">{displayEmployeeNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">입사일</p>
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
              <CardTitle className="text-base">변경 요청 현황</CardTitle>
              {pendingRequestCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="mr-1 h-3 w-3" />
                  {pendingRequestCount}건 대기중
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-info/change-requests')}
            >
              전체 보기
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            주소, 학력, 자격증, 가족사항, 경력사항 등의 변경은 HR 담당자의 승인이
            필요합니다. 상단의 "변경 요청" 버튼을 통해 변경을 요청할 수 있으며,
            요청 현황은 "전체 보기"에서 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog (Immediate - Contact Info) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>연락처 정보 수정</DialogTitle>
            <DialogDescription>
              연락처 정보는 즉시 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
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
              <Label htmlFor="mobile">연락처</Label>
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
              <Label htmlFor="nameEn">영문명</Label>
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
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? 'max-w-[calc(100%-2rem)] rounded-2xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>정보 변경 요청</DialogTitle>
          <DialogDescription>
            주소, 학력, 자격증, 가족사항, 경력사항 변경은 HR 담당자의 승인이
            필요합니다. 변경 내용과 사유를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cr-category">
              변경 구분 <span className="text-destructive">*</span>
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
                <SelectValue placeholder="변경 구분을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-fieldName">
              변경 항목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cr-fieldName"
              value={form.fieldName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fieldName: e.target.value }))
              }
              placeholder="예: 자택주소, 최종학력, 정보처리기사 등"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-oldValue">변경 전 값</Label>
            <Input
              id="cr-oldValue"
              value={form.oldValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, oldValue: e.target.value }))
              }
              placeholder="현재 등록된 값 (없으면 비워두세요)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-newValue">
              변경 후 값 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cr-newValue"
              value={form.newValue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newValue: e.target.value }))
              }
              placeholder="변경하고자 하는 값을 입력하세요"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-reason">
              변경 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cr-reason"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="변경 사유를 상세히 입력해주세요"
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
            취소
          </Button>
          <Button
            className={isMobile ? 'flex-1' : undefined}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                요청 중...
              </>
            ) : (
              <>
                <SendHorizonal className="mr-2 h-4 w-4" />
                변경 요청
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
