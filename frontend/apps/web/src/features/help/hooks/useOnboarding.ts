import { useState, useCallback } from 'react';
import { CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTourById, TourConfig } from '../data/tourSteps';

interface OnboardingState {
  completedTours: string[];
  skippedTours: string[];
}

const ONBOARDING_STORAGE_KEY = 'hr-platform-onboarding';

export function useOnboarding() {
  const [storageState, setStorageState] = useLocalStorage<OnboardingState>(
    ONBOARDING_STORAGE_KEY,
    { completedTours: [], skippedTours: [] }
  );

  const [currentTour, setCurrentTour] = useState<TourConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const startTour = useCallback((tourId: string) => {
    const tour = getTourById(tourId);
    if (tour) {
      setCurrentTour(tour);
      setStepIndex(0);
      setIsRunning(true);
    }
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
  }, []);

  const completeTour = useCallback(
    (tourId: string) => {
      if (!storageState.completedTours.includes(tourId)) {
        setStorageState({
          ...storageState,
          completedTours: [...storageState.completedTours, tourId],
        });
      }
      stopTour();
    },
    [storageState, setStorageState, stopTour]
  );

  const skipTour = useCallback(
    (tourId: string) => {
      if (!storageState.skippedTours.includes(tourId)) {
        setStorageState({
          ...storageState,
          skippedTours: [...storageState.skippedTours, tourId],
        });
      }
      stopTour();
    },
    [storageState, setStorageState, stopTour]
  );

  const isTourCompleted = useCallback(
    (tourId: string) => {
      return storageState.completedTours.includes(tourId);
    },
    [storageState.completedTours]
  );

  const isTourSkipped = useCallback(
    (tourId: string) => {
      return storageState.skippedTours.includes(tourId);
    },
    [storageState.skippedTours]
  );

  const resetTours = useCallback(() => {
    setStorageState({ completedTours: [], skippedTours: [] });
  }, [setStorageState]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      }

      if (status === STATUS.FINISHED) {
        if (currentTour) {
          completeTour(currentTour.id);
        }
      }

      if (status === STATUS.SKIPPED) {
        if (currentTour) {
          skipTour(currentTour.id);
        }
      }
    },
    [currentTour, completeTour, skipTour]
  );

  return {
    currentTour,
    isRunning,
    stepIndex,
    completedTours: storageState.completedTours,
    skippedTours: storageState.skippedTours,
    startTour,
    stopTour,
    completeTour,
    skipTour,
    isTourCompleted,
    isTourSkipped,
    resetTours,
    handleJoyrideCallback,
  };
}

export default useOnboarding;
