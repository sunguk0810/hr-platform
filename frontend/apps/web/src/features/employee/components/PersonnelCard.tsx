import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';

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
    const { t } = useTranslation('employee');
    const printDate = format(new Date(), 'yyyy년 M월 d일', { locale: ko });

    return (
      <div
        ref={ref}
        className={cn(
          'w-[210mm] min-h-[297mm] bg-background p-8 text-foreground print:p-0',
          className
        )}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.tenantLogo && (
                <OptimizedImage
                  src={data.tenantLogo}
                  alt={data.tenantName}
                  className="h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{data.tenantName}</h1>
                <p className="text-sm text-gray-600">{t('recordCard.personnelCard.printTitle')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('recordCard.printDate', { date: printDate })}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-8">
          {/* Profile Section */}
          <section className="flex gap-8">
            <div className="shrink-0">
              <div className="h-40 w-32 overflow-hidden rounded border">
                {data.profileImage ? (
                  <OptimizedImage
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
                {t('recordCard.personnelCard.basicInfo')}
              </h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  <tr>
                    <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.employeeNumber')}
                    </th>
                    <td className="py-1.5">{data.employeeNumber}</td>
                    <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.name')}
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
                      {t('recordCard.personnelCard.birthDate')}
                    </th>
                    <td className="py-1.5">
                      {data.birthDate
                        ? format(data.birthDate, 'yyyy년 M월 d일', {
                            locale: ko,
                          })
                        : '-'}
                    </td>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.gender')}
                    </th>
                    <td className="py-1.5">
                      {data.gender === 'MALE'
                        ? t('gender.male')
                        : data.gender === 'FEMALE'
                        ? t('gender.female')
                        : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.email')}
                    </th>
                    <td className="py-1.5" colSpan={3}>
                      {data.email}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.phone')}
                    </th>
                    <td className="py-1.5" colSpan={3}>
                      {data.mobile}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-1.5 text-left font-medium text-gray-600">
                      {t('recordCard.personnelCard.address')}
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
              {t('recordCard.personnelCard.employmentInfo')}
            </h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                <tr>
                  <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                    {t('recordCard.personnelCard.hireDate')}
                  </th>
                  <td className="py-1.5">
                    {format(data.hireDate, 'yyyy년 M월 d일', { locale: ko })}
                  </td>
                  <th className="w-24 py-1.5 text-left font-medium text-gray-600">
                    {t('recordCard.personnelCard.employmentType')}
                  </th>
                  <td className="py-1.5">{data.employmentType}</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    {t('recordCard.personnelCard.department')}
                  </th>
                  <td className="py-1.5">{data.department}</td>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    {t('recordCard.personnelCard.position')}
                  </th>
                  <td className="py-1.5">{data.position}</td>
                </tr>
                <tr>
                  <th className="py-1.5 text-left font-medium text-gray-600">
                    {t('recordCard.personnelCard.grade')}
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
              {t('recordCard.personnelCard.educationSection')}
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationSchoolType')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationSchoolName')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationMajor')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationAdmission')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationGraduation')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.educationStatus')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={6}>
                    {t('recordCard.personnelCard.educationPlaceholder')}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              {t('recordCard.personnelCard.careerSection')}
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerCompanyName')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerDepartment')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerPosition')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerStartDate')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerEndDate')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.careerDuties')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={6}>
                    {t('recordCard.personnelCard.careerPlaceholder')}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              {t('recordCard.personnelCard.certificateSection')}
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.certificateName')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.certificateIssuer')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.certificateAcquiredDate')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.certificateGradeScore')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.certificateExpiry')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={5}>
                    {t('recordCard.personnelCard.certificatePlaceholder')}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
              {t('recordCard.personnelCard.familySection')}
            </h2>
            <table className="mt-3 w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.familyRelation')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.familyName')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.familyBirthDate')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.familyOccupation')}</th>
                  <th className="border px-3 py-2 text-left">{t('recordCard.personnelCard.familyCohabiting')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-8 text-center text-gray-400" colSpan={5}>
                    {t('recordCard.personnelCard.familyPlaceholder')}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t pt-4">
          <p className="text-center text-xs text-gray-500">
            {t('recordCard.officialDoc', { tenantName: data.tenantName })}
          </p>
        </div>
      </div>
    );
  }
);

PersonnelCard.displayName = 'PersonnelCard';

export default PersonnelCard;
