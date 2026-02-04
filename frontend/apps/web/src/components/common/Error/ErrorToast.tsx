import { useCallback } from 'react';
import { AxiosError } from 'axios';
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
    switch (error.response?.status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 409:
        return '데이터 충돌이 발생했습니다.';
      case 422:
        return '입력값이 올바르지 않습니다.';
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다.';
      case 502:
      case 503:
      case 504:
        return '서비스가 일시적으로 이용 불가합니다.';
      default:
        return '네트워크 오류가 발생했습니다.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '알 수 없는 오류가 발생했습니다.';
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
    title: options?.title || '오류가 발생했습니다',
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
