import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export type MaskingType =
  | 'phone'
  | 'email'
  | 'name'
  | 'residentNumber'
  | 'bankAccount'
  | 'cardNumber'
  | 'custom';

export interface MaskedFieldProps {
  value: string;
  type?: MaskingType;
  customMask?: (value: string) => string;
  showToggle?: boolean;
  canReveal?: boolean;
  onRevealRequest?: () => Promise<string>;
  className?: string;
}

const maskFunctions: Record<MaskingType, (value: string) => string> = {
  phone: (value) => {
    // 010-1234-5678 -> 010-****-5678
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length < 7) return value.replace(/./g, '*');
    return value.replace(/(\d{3}[-.\s]?)(\d{4})([-.\s]?\d{4})/, '$1****$3');
  },
  email: (value) => {
    // user@example.com -> u***@example.com
    const [local, domain] = value.split('@');
    if (!domain) return '***';
    const maskedLocal = local.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  },
  name: (value) => {
    // 홍길동 -> 홍*동
    if (value.length <= 1) return '*';
    if (value.length === 2) return value.charAt(0) + '*';
    return (
      value.charAt(0) +
      '*'.repeat(value.length - 2) +
      value.charAt(value.length - 1)
    );
  },
  residentNumber: (value) => {
    // 901231-1234567 -> 901231-*******
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length < 7) return '*'.repeat(value.length);
    return value.replace(/(\d{6}[-.]?)(\d{7})/, '$1*******');
  },
  bankAccount: (value) => {
    // 123-456-789012 -> ***-***-789012
    const parts = value.split('-');
    if (parts.length < 2) return value.replace(/\d/g, '*');
    return parts
      .map((part, i) => (i < parts.length - 1 ? '*'.repeat(part.length) : part))
      .join('-');
  },
  cardNumber: (value) => {
    // 1234-5678-9012-3456 -> ****-****-****-3456
    const parts = value.split('-');
    if (parts.length < 2) {
      const cleaned = value.replace(/[^0-9]/g, '');
      if (cleaned.length <= 4) return '*'.repeat(cleaned.length);
      return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
    }
    return parts
      .map((part, i) => (i < parts.length - 1 ? '*'.repeat(part.length) : part))
      .join('-');
  },
  custom: (value) => value,
};

export function MaskedField({
  value,
  type = 'custom',
  customMask,
  showToggle = true,
  canReveal = false,
  onRevealRequest,
  className,
}: MaskedFieldProps) {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [revealedValue, setRevealedValue] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const getMaskedValue = React.useCallback(() => {
    if (!value) return '-';
    if (customMask) return customMask(value);
    return maskFunctions[type](value);
  }, [value, type, customMask]);

  const handleToggle = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (onRevealRequest) {
      setLoading(true);
      try {
        const revealed = await onRevealRequest();
        setRevealedValue(revealed);
        setIsRevealed(true);
      } catch {
        // Handle error silently or show toast
      } finally {
        setLoading(false);
      }
    } else {
      setIsRevealed(true);
    }
  };

  const displayValue = isRevealed
    ? revealedValue ?? value
    : getMaskedValue();

  if (!showToggle || !canReveal) {
    return (
      <span className={cn('font-mono', className)}>{getMaskedValue()}</span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="font-mono">{displayValue}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleToggle}
        disabled={loading}
        aria-label={isRevealed ? '숨기기' : '보기'}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isRevealed ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </span>
  );
}
