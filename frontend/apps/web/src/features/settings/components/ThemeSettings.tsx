import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themes: ThemeOption[] = [
  {
    value: 'light',
    label: '라이트 모드',
    description: '밝은 배경의 기본 테마',
    icon: <Sun className="h-6 w-6" />,
  },
  {
    value: 'dark',
    label: '다크 모드',
    description: '어두운 배경의 테마',
    icon: <Moon className="h-6 w-6" />,
  },
  {
    value: 'system',
    label: '시스템 설정',
    description: '운영체제 설정에 따라 자동 변경',
    icon: <Monitor className="h-6 w-6" />,
  },
];

export function ThemeSettings() {
  const { theme, setTheme } = useUIStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">테마 설정</CardTitle>
        <CardDescription>
          화면 테마를 선택하세요
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
                  'relative flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-all',
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
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">미리보기</p>
          <div className="grid gap-3 sm:grid-cols-2">
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
