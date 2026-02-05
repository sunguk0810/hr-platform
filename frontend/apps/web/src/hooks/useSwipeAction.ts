import { useState, useCallback, useRef } from 'react';

type SwipeDirection = 'left' | 'right' | null;

interface UseSwipeActionOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxSwipe?: number;
}

interface UseSwipeActionReturn {
  offset: number;
  direction: SwipeDirection;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  reset: () => void;
}

export function useSwipeAction({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  maxSwipe = 120,
}: UseSwipeActionOptions = {}): UseSwipeActionReturn {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const direction: SwipeDirection = offset > 0 ? 'right' : offset < 0 ? 'left' : null;

  const reset = useCallback(() => {
    setOffset(0);
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine if this is a horizontal or vertical swipe
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only process horizontal swipes
    if (isHorizontalSwipe.current === true) {
      // Check if swipe direction has associated action
      const canSwipeLeft = diffX < 0 && onSwipeLeft;
      const canSwipeRight = diffX > 0 && onSwipeRight;

      if (canSwipeLeft || canSwipeRight) {
        const clampedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
        setOffset(clampedOffset);
      }
    }
  }, [isSwiping, onSwipeLeft, onSwipeRight, maxSwipe]);

  const onTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    // Check if threshold was met
    if (Math.abs(offset) >= threshold) {
      if (offset < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (offset > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    reset();
  }, [isSwiping, offset, threshold, onSwipeLeft, onSwipeRight, reset]);

  return {
    offset,
    direction,
    isSwiping,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    reset,
  };
}
