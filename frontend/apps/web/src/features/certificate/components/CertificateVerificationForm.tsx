import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShieldCheck } from 'lucide-react';

interface CertificateVerificationFormProps {
  onVerify: (code: string) => void;
  isLoading: boolean;
}

export function CertificateVerificationForm({ onVerify, isLoading }: CertificateVerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim()) {
      onVerify(verificationCode.trim().toUpperCase());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only alphanumeric characters and hyphens
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setVerificationCode(value);
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>증명서 진위확인</CardTitle>
        <CardDescription>
          발급받은 증명서의 진위 여부를 확인합니다.
          <br />
          증명서 하단의 인증코드를 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="verificationCode">인증코드</Label>
            <Input
              id="verificationCode"
              value={verificationCode}
              onChange={handleChange}
              placeholder="예: CERT-XXXX-XXXX"
              className="text-center font-mono text-lg tracking-wider"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-center">
              증명서 하단에 표시된 인증코드를 입력하세요
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={verificationCode.length < 8 || isLoading}
          >
            {isLoading ? (
              '확인 중...'
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                진위 확인
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
