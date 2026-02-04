import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Mail, Phone, Building2, Briefcase, Calendar, Edit, Camera, Loader2, Trash2 } from 'lucide-react';
import { profileService, type UpdateProfileRequest, type UserProfile } from '../services/profileService';

export default function MyInfoPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    mobile: '',
    email: '',
    nameEn: '',
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
          description: '내 정보가 수정되었습니다.',
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
        <PageHeader
          title="내 정보"
          description="개인 정보 및 근무 정보를 확인하고 관리합니다."
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="내 정보"
        description="개인 정보 및 근무 정보를 확인하고 관리합니다."
        actions={
          <Button onClick={handleEditOpen}>
            <Edit className="mr-2 h-4 w-4" />
            정보 수정
          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>내 정보 수정</DialogTitle>
            <DialogDescription>
              수정 가능한 정보를 입력해주세요.
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
    </>
  );
}
