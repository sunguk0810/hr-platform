import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorPageProps {
  statusCode?: number;
  title: string;
  description?: string;
  icon?: ReactNode;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
  className?: string;
  children?: ReactNode;
}

export function ErrorPage({
  statusCode,
  title,
  description,
  icon,
  showHomeButton = true,
  showBackButton = true,
  showRetryButton = false,
  onRetry,
  className,
  children,
}: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex min-h-[60vh] flex-col items-center justify-center px-4 py-16',
        className
      )}
    >
      <div className="w-full max-w-md text-center">
        {/* Icon or Status Code */}
        {icon ? (
          <div className="mb-6 flex justify-center">{icon}</div>
        ) : statusCode ? (
          <div className="mb-6">
            <span className="text-8xl font-bold text-primary/20">{statusCode}</span>
          </div>
        ) : null}

        {/* Title */}
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="mb-8 text-muted-foreground">{description}</p>
        )}

        {/* Custom Content */}
        {children}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로 가기
            </Button>
          )}
          {showHomeButton && (
            <Button onClick={() => navigate('/')} className="gap-2">
              <Home className="h-4 w-4" />
              홈으로 이동
            </Button>
          )}
          {showRetryButton && onRetry && (
            <Button variant="secondary" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
