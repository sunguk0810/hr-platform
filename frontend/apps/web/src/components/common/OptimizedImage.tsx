import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  src,
  fallbackSrc,
  fallbackIcon,
  alt = '',
  aspectRatio = 'auto',
  objectFit = 'cover',
  lazy = true,
  showSkeleton = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const aspectRatioClasses: Record<NonNullable<OptimizedImageProps['aspectRatio']>, string> = {
    square: 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    auto: '',
  };

  const objectFitClasses: Record<NonNullable<OptimizedImageProps['objectFit']>, string> = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  const shouldShowFallback = hasError || !src;
  const imageSrc = shouldShowFallback && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {showSkeleton && isLoading && !shouldShowFallback && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* Fallback Icon */}
      {shouldShowFallback && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          {fallbackIcon || <User className="h-1/3 w-1/3 max-h-16 max-w-16" />}
        </div>
      )}

      {/* Image */}
      {isInView && imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          className={cn(
            'h-full w-full transition-opacity duration-300',
            objectFitClasses[objectFit],
            isLoading ? 'opacity-0' : 'opacity-100',
            shouldShowFallback && !fallbackSrc && 'hidden'
          )}
          {...props}
        />
      )}
    </div>
  );
}

export default OptimizedImage;
