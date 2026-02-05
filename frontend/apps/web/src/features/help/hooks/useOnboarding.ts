import { useOnboardingContext } from '../contexts/OnboardingContext';

export function useOnboarding() {
  return useOnboardingContext();
}

export default useOnboarding;
