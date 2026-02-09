import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeOption {
  value: Theme;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

const themes: ThemeOption[] = [
  {
    value: 'light',
    labelKey: 'themeSettings.light.label',
    descriptionKey: 'themeSettings.light.description',
    icon: <Sun className="h-6 w-6" />,
  },
  {
    value: 'dark',
    labelKey: 'themeSettings.dark.label',
    descriptionKey: 'themeSettings.dark.description',
    icon: <Moon className="h-6 w-6" />,
  },
  {
    value: 'system',
    labelKey: 'themeSettings.system.label',
    descriptionKey: 'themeSettings.system.description',
    icon: <Monitor className="h-6 w-6" />,
  },
];

export function ThemeSettings() {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useUIStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('themeSettings.title')}</CardTitle>
        <CardDescription>
          {t('themeSettings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((option) => {
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'relative flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                    : 'hover:bg-muted/50'
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </span>
                )}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    option.value === 'light' && 'bg-amber-100 text-amber-600',
                    option.value === 'dark' && 'bg-indigo-100 text-indigo-600',
                    option.value === 'system' && 'bg-gray-100 text-gray-600'
                  )}
                >
                  {option.icon}
                </div>
                <div>
                  <p className="font-medium">{t(option.labelKey)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(option.descriptionKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">{t('themeSettings.preview')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Theme preview intentionally uses hardcoded colors to demonstrate the theme */}
            {/* Light preview */}
            <div className="rounded-lg border bg-white p-4 text-gray-900">
              <div className="mb-2 h-2 w-20 rounded bg-gray-200" />
              <div className="mb-2 h-2 w-32 rounded bg-gray-100" />
              <div className="h-2 w-24 rounded bg-gray-100" />
            </div>
            {/* Dark preview */}
            <div className="rounded-lg border bg-gray-900 p-4 text-white">
              <div className="mb-2 h-2 w-20 rounded bg-gray-700" />
              <div className="mb-2 h-2 w-32 rounded bg-gray-800" />
              <div className="h-2 w-24 rounded bg-gray-800" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThemeSettings;
