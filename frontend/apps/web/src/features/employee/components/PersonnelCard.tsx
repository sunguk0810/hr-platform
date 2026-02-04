import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface PersonnelCardData {
  // Basic Info
  employeeNumber: string;
  name: string;
  nameEn?: string;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE';
  profileImage?: string;

  // Employment Info
  hireDate: Date;
  department: string;
  position: string;
  grade: string;
  employmentType: string;

  // Contact Info
  email: string;
  mobile: string;
  address?: string;

  // Organization Info
  tenantName: string;
  tenantLogo?: string;
}

interface PersonnelCardProps {
  data: PersonnelCardData;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const PersonnelCard = forwardRef<HTMLDivElement, PersonnelCardProps>(
  ({ data, className }, ref) => {
    const printDate = format(new Date(), 'yyyy년 M월 d일', { locale: ko });

    return (
      <div
        ref={ref}
        className={cn(
          'w-[210mm] min-h-[297mm] bg-white p-8 text-black print:p-0',
          className
        )}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.tenantLogo && (
                <img
                  src={data.tenantLogo}
                  alt={data.tenantName}
                  className="h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{data.tenantName}</h1>
                <p className="text-sm text-gray-600">인사기록카드</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">출력일: {printDate}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-8">
          {/* Profile Section */}
          <section className="flex gap-8">
            <div className="shrink-0">
              <div className="h-40 w-32 overflow-hidden rounded border">
                {data.profileImage ? (
                  <img
                    src={data.profileImage}
                    alt={data.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                    {getInitials(data.name)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
                기본 정보
              </h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  <tr>
                    <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                      사번
                    </th>
                    <td className="py-1.5">{data.employeeNumber}</td>
                    <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                      이름
                    </th>
                    <td className="py-1.5">
                      {data.name}
                      {data.nameEn && (
                        <span className="ml-2 text-gray-500">
                          ({data.nameEn})
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      생년월일
                    </th>
                    <td className="py-1.5">
                      {data.birthDate
                        ? format(data.birthDate, 'yyyy년 M월 d일', {
                            locale: ko,
                          })
                        : '-'}
                    </td>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      성별
                    </th>
                    <td className="py-1.5">
                      {data.gender === 'MALE'
                        ? '남성'
                        : data.gender === 'FEMALE'
                        ? '여성'
                        : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      이메일
                    </th>
                    <td className="py-1.5" colSpan={3}>
                      {data.email}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      연락처
                    </th>
                    <td className="py-1.5" colSpan={3}>
                      {data.mobile}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      주소
                    </th>
                    <td className="py-1.5" colSpan={3}>
                      {data.address || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Employment Section */}
          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              근무 정보
            </h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                <tr>
                  <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                    입사일
                  </th>
                  <td className="py-1.5">
                    {format(data.hireDate, 'yyyy년 M월 d일', { locale: ko })}
                  </td>
                  <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                    고용형태
                  </th>
                  <td className="py-1.5">{data.employmentType}</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    부서
                  </th>
                  <td className="py-1.5">{data.department}</td>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    직위
                  </th>
                  <td className="py-1.5">{data.position}</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    직급
                  </th>
                  <td className="py-1.5" colSpan={3}>
                    {data.grade}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Placeholder sections for print */}
          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              학력 사항
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">학교 구분</th>
                  <th className="border px-3 py-2 text-left">학교명</th>
                  <th className="border px-3 py-2 text-left">전공</th>
                  <th className="border px-3 py-2 text-left">입학일</th>
                  <th className="border px-3 py-2 text-left">졸업일</th>
                  <th className="border px-3 py-2 text-left">상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={6}>
                    학력 정보가 표시됩니다
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              경력 사항
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">회사명</th>
                  <th className="border px-3 py-2 text-left">부서</th>
                  <th className="border px-3 py-2 text-left">직위</th>
                  <th className="border px-3 py-2 text-left">입사일</th>
                  <th className="border px-3 py-2 text-left">퇴사일</th>
                  <th className="border px-3 py-2 text-left">담당업무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={6}>
                    경력 정보가 표시됩니다
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              자격증/어학
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">자격증명</th>
                  <th className="border px-3 py-2 text-left">발급기관</th>
                  <th className="border px-3 py-2 text-left">취득일</th>
                  <th className="border px-3 py-2 text-left">등급/점수</th>
                  <th className="border px-3 py-2 text-left">유효기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={5}>
                    자격증 정보가 표시됩니다
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              가족 관계
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">관계</th>
                  <th className="border px-3 py-2 text-left">이름</th>
                  <th className="border px-3 py-2 text-left">생년월일</th>
                  <th className="border px-3 py-2 text-left">직업</th>
                  <th className="border px-3 py-2 text-left">동거여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={5}>
                    가족 정보가 표시됩니다
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t pt-4">
          <p className="text-center text-xs text-gray-500">
            본 인사기록카드는 {data.tenantName}에서 발급한 공식 문서입니다.
          </p>
        </div>
      </div>
    );
  }
);

PersonnelCard.displayName = 'PersonnelCard';

export default PersonnelCard;
