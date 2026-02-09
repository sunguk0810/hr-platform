import { useTranslation } from 'react-i18next';
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

const genderKeys: Record<string, string> = {
  MALE: 'gender.male',
  FEMALE: 'gender.female',
};

const militaryStatusKeys: Record<string, string> = {
  NOT_APPLICABLE: 'recordCard.basic.militaryStatusOptions.NOT_APPLICABLE',
  COMPLETED: 'recordCard.basic.militaryStatusOptions.COMPLETED',
  EXEMPT: 'recordCard.basic.militaryStatusOptions.EXEMPT',
  SERVING: 'recordCard.basic.militaryStatusOptions.SERVING',
  NOT_SERVED: 'recordCard.basic.militaryStatusOptions.NOT_SERVED',
};

export function RecordCardBasic({ detail }: RecordCardBasicProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          {t('recordCard.basic.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <dl>
            <InfoRow label={t('recordCard.basic.birthDate')} value={formatDate(detail.birthDate)} />
            <InfoRow label={t('recordCard.basic.gender')} value={detail.gender ? t(genderKeys[detail.gender]) : '-'} />
            <InfoRow label={t('recordCard.basic.nationality')} value={detail.nationality} />
            <InfoRow label={t('recordCard.basic.bloodType')} value={detail.bloodType} />
          </dl>
          <dl>
            <InfoRow
              label={t('recordCard.basic.address')}
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
            <InfoRow label={t('recordCard.basic.emergencyPhone')} value={detail.emergencyPhone ? <MaskedField value={detail.emergencyPhone} type="phone" /> : '-'} />
            <InfoRow
              label={t('recordCard.basic.emergencyRelation')}
              value={
                detail.emergencyContact
                  ? `${detail.emergencyContact} (${detail.emergencyRelation || ''})`
                  : '-'
              }
            />
          </dl>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">{t('recordCard.basic.military')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <dl>
              <InfoRow
                label={t('recordCard.basic.militaryStatus')}
                value={detail.militaryStatus ? t(militaryStatusKeys[detail.militaryStatus]) : '-'}
              />
              <InfoRow label={t('recordCard.basic.militaryBranch')} value={detail.militaryBranch} />
            </dl>
            <dl>
              <InfoRow label={t('recordCard.basic.militaryRank')} value={detail.militaryRank} />
              <InfoRow
                label={t('recordCard.basic.militaryPeriod')}
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
            <h4 className="text-sm font-medium mb-3">{t('recordCard.basic.disability')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <dl>
                <InfoRow label={t('recordCard.basic.disabilityGrade')} value={detail.disabilityGrade} />
                <InfoRow label={t('recordCard.basic.disabilityType')} value={detail.disabilityType} />
              </dl>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">{t('recordCard.basic.finance')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <dl>
              <InfoRow label={t('recordCard.basic.bank')} value={detail.bankName || detail.bankCode} />
              <InfoRow label={t('recordCard.basic.bankAccount')} value={detail.bankAccount ? <MaskedField value={detail.bankAccount} type="bankAccount" /> : '-'} />
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
