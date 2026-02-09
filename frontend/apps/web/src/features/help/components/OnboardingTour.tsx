import Joyride, { TooltipRenderProps, Styles } from 'react-joyride';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../hooks/useOnboarding';

interface OnboardingTourProps {
  tourId?: string;
  autoStart?: boolean;
}

const joyrideStyles: Partial<Styles> = {
  options: {
    zIndex: 10000,
    arrowColor: 'hsl(var(--card))',
    backgroundColor: 'hsl(var(--card))',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--foreground))',
  },
  tooltip: {
    borderRadius: '8px',
    padding: 0,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
    marginRight: 8,
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
  },
};

function CustomTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  const { t } = useTranslation('help');

  return (
    <div
      {...tooltipProps}
      className="w-[320px] rounded-lg border bg-card shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {index + 1} / {size}
        </span>
        <button
          {...closeProps}
          className="rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {step.title && (
          <h3 className="mb-2 font-semibold">{step.title}</h3>
        )}
        <p className="text-sm text-muted-foreground">{step.content}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <div>
          {!isLastStep && (
            <Button
              {...skipProps}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              {t('onboarding.skip')}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button {...backProps} variant="outline" size="sm">
              {t('onboarding.previous')}
            </Button>
          )}
          <Button {...primaryProps} size="sm">
            {isLastStep ? t('onboarding.done') : t('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour({ tourId, autoStart = false }: OnboardingTourProps) {
  const { t } = useTranslation('help');
  const {
    currentTour,
    isRunning,
    stepIndex,
    handleJoyrideCallback,
    startTour,
    isTourCompleted,
    isTourSkipped,
  } = useOnboarding();

  // Auto-start logic
  if (autoStart && tourId && !isRunning && !isTourCompleted(tourId) && !isTourSkipped(tourId)) {
    // Start after a small delay to ensure DOM is ready
    setTimeout(() => startTour(tourId), 500);
  }

  if (!currentTour || !isRunning) {
    return null;
  }

  return (
    <Joyride
      steps={currentTour.steps}
      run={isRunning}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      styles={joyrideStyles}
      tooltipComponent={CustomTooltip}
      locale={{
        back: t('onboarding.back'),
        close: t('onboarding.close'),
        last: t('onboarding.last'),
        next: t('onboarding.next'),
        skip: t('onboarding.skip'),
      }}
    />
  );
}

export default OnboardingTour;
