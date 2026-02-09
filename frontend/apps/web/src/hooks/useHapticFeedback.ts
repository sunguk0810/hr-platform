import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy';

interface HapticFeedback {
  trigger: (style?: HapticStyle) => void;
  isSupported: boolean;
}

export function useHapticFeedback(): HapticFeedback {
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

  const trigger = useCallback((style: HapticStyle = 'medium') => {
    if (!isSupported) return;

    const patterns: Record<HapticStyle, number> = {
      light: 10,
      medium: 20,
      heavy: 30,
    };

    navigator.vibrate(patterns[style]);
  }, [isSupported]);

  return { trigger, isSupported };
}
