import { useCallback } from 'react';
import { AxiosError } from 'axios';
import i18n from '@/lib/i18n';
import { toast } from '@/hooks/useToast';

interface ApiErrorResponse {
  code?: string;
  message?: string;
  details?: Record<string, string[]>;
}

export interface ErrorToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    // Check for API error message
    if (data?.message) {
      return data.message;
    }

    // Check for validation errors
    if (data?.details) {
      const firstError = Object.values(data.details)[0];
      if (firstError?.[0]) {
        return firstError[0];
      }
    }

    // HTTP status-based messages
    const t = (key: string) => i18n.t(key, { ns: 'common' });
    switch (error.response?.status) {
      case 400:
        return t('httpError.400');
      case 401:
        return t('httpError.401');
      case 403:
        return t('httpError.403');
      case 404:
        return t('httpError.404');
      case 409:
        return t('httpError.409');
      case 422:
        return t('httpError.422');
      case 429:
        return t('httpError.429');
      case 500:
        return t('httpError.500');
      case 502:
        return t('httpError.502');
      case 503:
        return t('httpError.503');
      case 504:
        return t('httpError.504');
      default:
        return t('httpError.networkError');
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return i18n.t('httpError.unknown', { ns: 'common' });
}

/**
 * Get error code from API error
 */
function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.code;
  }
  return undefined;
}

/**
 * Show error toast with automatic message extraction
 */
export function showErrorToast(error: unknown, options?: ErrorToastOptions) {
  const errorCode = getErrorCode(error);
  const errorMessage = getErrorMessage(error);

  toast({
    variant: 'destructive',
    title: options?.title || i18n.t('error', { ns: 'common' }),
    description:
      options?.description ||
      (errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage),
  });
}

/**
 * Hook for showing error toasts
 */
export function useErrorToast() {
  const showError = useCallback(
    (error: unknown, options?: ErrorToastOptions) => {
      showErrorToast(error, options);
    },
    []
  );

  return { showError };
}

export default showErrorToast;
