import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('certificate');
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
        <CardTitle>{t('verification.cardTitle')}</CardTitle>
        <CardDescription>
          {t('verification.cardDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="verificationCode">{t('verification.codeLabel')}</Label>
            <Input
              id="verificationCode"
              value={verificationCode}
              onChange={handleChange}
              placeholder={t('verification.codePlaceholder')}
              className="text-center font-mono text-lg tracking-wider"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-center">
              {t('verification.codeHelp')}
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={verificationCode.length < 8 || isLoading}
          >
            {isLoading ? (
              t('verification.verifying')
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {t('verification.verifyButton')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
