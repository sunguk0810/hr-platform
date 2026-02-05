import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useOrganizationTree } from '@/features/organization/hooks/useOrganization';
import { useCreateEmployee } from '../hooks/useEmployees';
import type { CreateEmployeeRequest, Gender, DepartmentTreeNode } from '@hr-platform/shared-types';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: orgTreeData } = useOrganizationTree();
  const createMutation = useCreateEmployee();

  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    employeeNumber: '',
    name: '',
    nameEn: '',
    email: '',
    mobile: '',
    birthDate: '',
    gender: undefined,
    hireDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    positionId: '',
    gradeId: '',
  });

  const [autoGenerateNumber, setAutoGenerateNumber] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Flatten department tree for select
  const flattenTree = (
    nodes: DepartmentTreeNode[],
    result: { id: string; name: string; level: number }[] = []
  ): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  const departments = flattenTree(orgTreeData?.data ?? []);

  // Mock grades and positions (should come from API)
  const grades = [
    { id: 'grade-001', name: '부장' },
    { id: 'grade-002', name: '차장' },
    { id: 'grade-003', name: '과장' },
    { id: 'grade-004', name: '대리' },
    { id: 'grade-005', name: '사원' },
  ];

  const positions = [
    { id: 'pos-001', name: '팀장' },
    { id: 'pos-002', name: '선임' },
    { id: 'pos-003', name: '매니저' },
    { id: 'pos-004', name: '주임' },
    { id: 'pos-005', name: '책임' },
    { id: 'pos-006', name: '사원' },
  ];

  const handleInputChange = (field: keyof CreateEmployeeRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      employeeNumber: autoGenerateNumber
        ? `EMP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        : formData.employeeNumber,
    };

    try {
      await createMutation.mutateAsync(submitData);
      navigate('/employees');
    } catch (error) {
      console.error('Failed to create employee:', error);
    }
  };

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.hireDate &&
    formData.departmentId &&
    (autoGenerateNumber || formData.employeeNumber);

  // Mobile Layout
  if (isMobile) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 pb-24">
        {/* Mobile Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">직원 등록</h1>
            <p className="text-sm text-muted-foreground">새로운 직원 등록</p>
          </div>
        </div>

        {/* Profile Image */}
        <div className="flex items-center justify-center gap-4 bg-card rounded-xl border p-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profileImage || undefined} />
            <AvatarFallback>
              <User className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="mobile-profile-image" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" />
                프로필 사진 업로드
              </div>
            </Label>
            <input
              id="mobile-profile-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG (최대 5MB)</p>
          </div>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="text-sm font-medium">기본 정보</h3>

          <div className="space-y-2">
            <Label htmlFor="mobile-name">이름 *</Label>
            <Input
              id="mobile-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="홍길동"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-nameEn">영문명</Label>
            <Input
              id="mobile-nameEn"
              value={formData.nameEn}
              onChange={(e) => handleInputChange('nameEn', e.target.value)}
              placeholder="Gil-dong Hong"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-email">이메일 *</Label>
            <Input
              id="mobile-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="hong@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-mobile">휴대전화</Label>
            <Input
              id="mobile-mobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              placeholder="010-1234-5678"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-birthDate">생년월일</Label>
              <Input
                id="mobile-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-gender">성별</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(value) => handleInputChange('gender', value as Gender)}
              >
                <SelectTrigger id="mobile-gender">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">남성</SelectItem>
                  <SelectItem value="FEMALE">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 소속 정보 섹션 */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="text-sm font-medium">소속 정보</h3>

          <div className="space-y-2">
            <Label htmlFor="mobile-departmentId">부서 *</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => handleInputChange('departmentId', value)}
            >
              <SelectTrigger id="mobile-departmentId">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {'　'.repeat(dept.level - 1)}
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-gradeId">직급</Label>
              <Select
                value={formData.gradeId || ''}
                onValueChange={(value) => handleInputChange('gradeId', value)}
              >
                <SelectTrigger id="mobile-gradeId">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-positionId">직책</Label>
              <Select
                value={formData.positionId || ''}
                onValueChange={(value) => handleInputChange('positionId', value)}
              >
                <SelectTrigger id="mobile-positionId">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile-hireDate">입사일 *</Label>
            <Input
              id="mobile-hireDate"
              type="date"
              value={formData.hireDate}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
            />
          </div>
        </div>

        {/* 계정 정보 섹션 */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="text-sm font-medium">계정 정보</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile-employeeNumber">사번</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoGenerateNumber}
                  onChange={(e) => setAutoGenerateNumber(e.target.checked)}
                  className="rounded border-gray-300"
                />
                자동 생성
              </label>
            </div>
            <Input
              id="mobile-employeeNumber"
              value={formData.employeeNumber}
              onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
              placeholder={autoGenerateNumber ? '자동 생성됨' : 'EMP2024001'}
              disabled={autoGenerateNumber}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            초기 비밀번호는 이메일로 전송됩니다.
          </p>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/employees')}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={!isFormValid || createMutation.isPending} className="flex-1">
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              등록
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="직원 등록"
        description="새로운 직원 정보를 등록합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback>
                  <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    프로필 사진 업로드
                  </div>
                </Label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG 형식 (최대 5MB)
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">영문명</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  placeholder="Gil-dong Hong"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="hong@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">휴대전화</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">생년월일</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">성별</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => handleInputChange('gender', value as Gender)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">남성</SelectItem>
                    <SelectItem value="FEMALE">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>소속 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departmentId">부서 *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'　'.repeat(dept.level - 1)}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradeId">직급</Label>
                <Select
                  value={formData.gradeId || ''}
                  onValueChange={(value) => handleInputChange('gradeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직급 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionId">직책</Label>
                <Select
                  value={formData.positionId || ''}
                  onValueChange={(value) => handleInputChange('positionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">입사일 *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employeeNumber">사번</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoGenerateNumber}
                      onChange={(e) => setAutoGenerateNumber(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    자동 생성
                  </label>
                </div>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                  placeholder={autoGenerateNumber ? '자동 생성됨' : 'EMP2024001'}
                  disabled={autoGenerateNumber}
                />
              </div>
              <div className="space-y-2">
                <Label>초기 비밀번호</Label>
                <p className="text-sm text-muted-foreground mt-2">
                  초기 비밀번호는 이메일로 전송됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/employees')}
          >
            취소
          </Button>
          <Button type="submit" disabled={!isFormValid || createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? '등록 중...' : '등록'}
          </Button>
        </div>
      </form>
    </>
  );
}
