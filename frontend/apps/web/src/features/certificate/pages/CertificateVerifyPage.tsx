import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { CertificateVerificationForm } from '../components/CertificateVerificationForm';
import { CertificateVerificationResult } from '../components/CertificateVerificationResult';
import { useVerifyCertificate } from '../hooks/useCertificates';
import type { VerificationResult } from '@hr-platform/shared-types';

export default function CertificateVerifyPage() {
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
      message: '증명서를 찾을 수 없거나 유효하지 않은 인증코드입니다.',
      reason: '인증코드를 다시 확인해주세요.',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-2xl py-12">
        <PageHeader
          title="증명서 진위확인"
          description="발급된 증명서의 진위 여부를 확인합니다."
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
            증명서 진위확인 서비스는 본 시스템에서 발급한 증명서만 확인 가능합니다.
          </p>
          <p className="mt-1">
            문의사항은 인사팀으로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
