import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonCard, SkeletonAvatar } from '@/components/common/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Edit, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployee } from '../hooks/useEmployees';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex py-2 border-b last:border-b-0">
      <dt className="w-28 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '-'}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useEmployee(id!);

  const employee = data?.data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatGender = (gender?: 'MALE' | 'FEMALE') => {
    if (!gender) return '-';
    return gender === 'MALE' ? '남성' : '여성';
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="직원 상세"
          description="로딩 중..."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <SkeletonAvatar className="h-20 w-20" />
                <SkeletonCard className="flex-1 border-0 p-0" />
              </div>
            </CardContent>
          </Card>
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (isError || !employee) {
    return (
      <>
        <PageHeader
          title="직원 상세"
          description="직원 정보를 찾을 수 없습니다."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">요청한 직원 정보를 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4">
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={employee.name}
        description={`${employee.departmentName} · ${employee.positionName || ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>비밀번호 초기화</DropdownMenuItem>
                <DropdownMenuItem>퇴직 처리</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
                <AvatarFallback className="text-lg">{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{employee.name}</h3>
                {employee.nameEn && (
                  <p className="text-sm text-muted-foreground">{employee.nameEn}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{employee.employeeNumber}</p>
              </div>
            </div>
            <dl>
              <InfoRow label="이메일" value={employee.email} />
              <InfoRow label="연락처" value={employee.mobile} />
              <InfoRow label="성별" value={formatGender(employee.gender)} />
              <InfoRow label="생년월일" value={formatDate(employee.birthDate)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>인사 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="부서" value={employee.departmentName} />
              <InfoRow label="직급" value={employee.positionName} />
              <InfoRow label="직급등급" value={employee.gradeName} />
              <InfoRow label="관리자" value={employee.managerName} />
              <InfoRow
                label="고용상태"
                value={<EmploymentStatusBadge status={employee.employmentStatus} />}
              />
              <InfoRow label="입사일" value={formatDate(employee.hireDate)} />
              {employee.resignationDate && (
                <InfoRow label="퇴직일" value={formatDate(employee.resignationDate)} />
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
