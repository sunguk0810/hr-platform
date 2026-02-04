import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaskedField } from '@/components/common/MaskedField';
import { User } from 'lucide-react';
import type { EmployeeDetail } from '@hr-platform/shared-types';

interface RecordCardBasicProps {
  detail: EmployeeDetail;
}

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

const genderLabels: Record<string, string> = {
  MALE: '남성',
  FEMALE: '여성',
};

const militaryStatusLabels: Record<string, string> = {
  NOT_APPLICABLE: '해당없음',
  COMPLETED: '군필',
  EXEMPT: '면제',
  SERVING: '복무중',
  NOT_SERVED: '미필',
};

export function RecordCardBasic({ detail }: RecordCardBasicProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          인적사항
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <dl>
            <InfoRow label="생년월일" value={formatDate(detail.birthDate)} />
            <InfoRow label="성별" value={detail.gender ? genderLabels[detail.gender] : '-'} />
            <InfoRow label="국적" value={detail.nationality} />
            <InfoRow label="혈액형" value={detail.bloodType} />
          </dl>
          <dl>
            <InfoRow
              label="주소"
              value={
                detail.address
                  ? <MaskedField
                      value={`${detail.address} ${detail.addressDetail || ''} (${detail.postalCode || ''})`}
                      type="custom"
                      customMask={(v) => v.length > 10 ? v.substring(0, 10) + '***' : v}
                    />
                  : '-'
              }
            />
            <InfoRow label="비상연락처" value={detail.emergencyPhone ? <MaskedField value={detail.emergencyPhone} type="phone" /> : '-'} />
            <InfoRow
              label="비상연락(관계)"
              value={
                detail.emergencyContact
                  ? `${detail.emergencyContact} (${detail.emergencyRelation || ''})`
                  : '-'
              }
            />
          </dl>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">병역사항</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <dl>
              <InfoRow
                label="병역"
                value={detail.militaryStatus ? militaryStatusLabels[detail.militaryStatus] : '-'}
              />
              <InfoRow label="군별" value={detail.militaryBranch} />
            </dl>
            <dl>
              <InfoRow label="계급" value={detail.militaryRank} />
              <InfoRow
                label="복무기간"
                value={
                  detail.militaryStartDate
                    ? `${formatDate(detail.militaryStartDate)} ~ ${formatDate(detail.militaryEndDate)}`
                    : '-'
                }
              />
            </dl>
          </div>
        </div>

        {(detail.disabilityGrade || detail.disabilityType) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">장애사항</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <dl>
                <InfoRow label="장애등급" value={detail.disabilityGrade} />
                <InfoRow label="장애유형" value={detail.disabilityType} />
              </dl>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">금융정보</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <dl>
              <InfoRow label="은행" value={detail.bankName || detail.bankCode} />
              <InfoRow label="계좌번호" value={detail.bankAccount ? <MaskedField value={detail.bankAccount} type="bankAccount" /> : '-'} />
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
