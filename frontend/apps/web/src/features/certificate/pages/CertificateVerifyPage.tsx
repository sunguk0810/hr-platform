import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { CertificateVerificationForm } from '../components/CertificateVerificationForm';
import { CertificateVerificationResult } from '../components/CertificateVerificationResult';
import { useVerifyCertificate } from '../hooks/useCertificates';
import type { VerificationResult } from '@hr-platform/shared-types';

export default function CertificateVerifyPage() {
  const { t } = useTranslation('certificate');
  const [verificationCode, setVerificationCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const { data, isLoading, isError } = useVerifyCertificate(verificationCode);

  const handleVerify = (code: string) => {
    setVerificationCode(code);
    setResult(null);
  };

  const handleReset = () => {
    setVerificationCode('');
    setResult(null);
  };

  // Update result when data changes
  if (data?.data && !result && verificationCode) {
    setResult(data.data);
  }

  // Handle error case
  if (isError && !result && verificationCode) {
    setResult({
      isValid: false,
      message: t('verification.notFound'),
      reason: t('verification.notFoundReason'),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-2xl py-12">
        <PageHeader
          title={t('verification.pageTitle')}
          description={t('verification.pageDescription')}
        />

        <div className="mt-8">
          {result ? (
            <CertificateVerificationResult result={result} onReset={handleReset} />
          ) : (
            <CertificateVerificationForm onVerify={handleVerify} isLoading={isLoading} />
          )}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            {t('verification.notice')}
          </p>
          <p className="mt-1">
            {t('verification.contactInfo')}
          </p>
        </div>
      </div>
    </div>
  );
}
