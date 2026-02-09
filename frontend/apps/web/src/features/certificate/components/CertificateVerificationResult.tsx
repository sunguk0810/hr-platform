import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateValidityBadge } from './CertificateStatusBadge';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Building2, User, FileText, Calendar } from 'lucide-react';
import type { VerificationResult } from '@hr-platform/shared-types';

interface CertificateVerificationResultProps {
  result: VerificationResult;
  onReset: () => void;
}

export function CertificateVerificationResult({ result, onReset }: CertificateVerificationResultProps) {
  const { t } = useTranslation('certificate');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'yyyy년 M월 d일', { locale: ko });
  };

  const isValid = result.isValid && !result.isRevoked && !result.isExpired;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center pb-2">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isValid
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          {isValid ? (
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          ) : result.isExpired ? (
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <CardTitle className="text-xl">
          {isValid ? t('verificationResult.valid') : result.isExpired ? t('verificationResult.expired') : t('verificationResult.invalid')}
        </CardTitle>
        <div className="mt-2">
          <CertificateValidityBadge
            isValid={result.isValid}
            isRevoked={result.isRevoked}
            isExpired={result.isExpired}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.message && (
          <div
            className={`p-3 rounded-md text-sm ${
              isValid
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {result.message}
          </div>
        )}

        {result.isValid && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">{t('verificationResult.certificateInfo')}</h4>

            {result.issueNumber && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.issueNumber')}</p>
                  <p className="font-mono">{result.issueNumber}</p>
                </div>
              </div>
            )}

            {result.certificateTypeName && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.certificateType')}</p>
                  <p>{result.certificateTypeName}</p>
                </div>
              </div>
            )}

            {result.employeeName && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.issuedTo')}</p>
                  <p>{result.employeeName}</p>
                </div>
              </div>
            )}

            {result.companyName && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.issuedBy')}</p>
                  <p>{result.companyName}</p>
                </div>
              </div>
            )}

            {result.issuedAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.issueDate')}</p>
                  <p>{formatDate(result.issuedAt)}</p>
                </div>
              </div>
            )}

            {result.expiresAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('verificationResult.validityPeriod')}</p>
                  <p>{formatDate(result.expiresAt)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!result.isValid && result.reason && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">{t('verificationResult.reason')}</h4>
            <p className="text-sm">{result.reason}</p>
          </div>
        )}

        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={onReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('verificationResult.verifyAnother')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
