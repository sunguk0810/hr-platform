import { useTranslation } from 'react-i18next';

export function SkipNavigation() {
  const { t } = useTranslation('accessibility');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t('skipToContent')}
    </a>
  );
}
