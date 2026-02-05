import { ReactNode, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { PageLoader } from '@/components/common/PageLoader';
import { OnboardingProvider } from '@/features/help';
import { OfflineBanner, InstallPrompt } from '@/components/pwa';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
        <OfflineBanner />
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
        <Toaster />
        <InstallPrompt />
      </OnboardingProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
