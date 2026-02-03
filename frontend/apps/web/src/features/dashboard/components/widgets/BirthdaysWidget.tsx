import { useQuery } from '@tanstack/react-query';
import { Cake, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WidgetContainer } from './WidgetContainer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface BirthdayPerson {
  id: string;
  name: string;
  nameEn?: string;
  profileImageUrl?: string;
  department: string;
  position: string;
  birthDate: string;
}

interface BirthdaysData {
  today: BirthdayPerson[];
  upcoming: BirthdayPerson[];
}

export function BirthdaysWidget() {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'ko' ? ko : enUS;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.birthdays(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: BirthdaysData }>(
        '/dashboard/birthdays'
      );
      return response.data.data;
    },
  });

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Create date for this year's birthday
    const birthdayThisYear = new Date(
      now.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (isToday(birthdayThisYear)) {
      return t('widgets.birthdays.today', '오늘');
    }
    if (isTomorrow(birthdayThisYear)) {
      return t('widgets.birthdays.tomorrow', '내일');
    }

    const daysUntil = differenceInDays(birthdayThisYear, now);
    if (daysUntil > 0 && daysUntil <= 7) {
      return t('widgets.birthdays.daysLater', '{{days}}일 후', { days: daysUntil });
    }

    return format(birthdayThisYear, 'M/d', { locale });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const renderPersonItem = (person: BirthdayPerson, showDate = false) => (
    <div
      key={person.id}
      className="flex items-center gap-3 rounded-lg border p-3"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={person.profileImageUrl} alt={person.name} />
        <AvatarFallback className="text-xs">
          {getInitials(person.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-sm">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {person.department} · {person.position}
        </p>
      </div>
      {showDate && (
        <Badge variant="outline" className="text-xs shrink-0">
          {getDateLabel(person.birthDate)}
        </Badge>
      )}
    </div>
  );

  const hasBirthdays = (data?.today?.length ?? 0) > 0 || (data?.upcoming?.length ?? 0) > 0;

  return (
    <WidgetContainer
      title={t('widgets.birthdays.title', '생일')}
      description={t('widgets.birthdays.description', '이번 주 생일자')}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {!hasBirthdays ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Cake className="mb-2 h-8 w-8" />
            <p className="text-sm">
              {t('widgets.birthdays.empty', '이번 주 생일자가 없습니다.')}
            </p>
          </div>
        ) : (
          <>
            {/* Today's birthdays */}
            {data?.today && data.today.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium text-pink-500">
                    {t('widgets.birthdays.todayBirthdays', '오늘 생일')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {data.today.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {data.today.map((person) => (
                    <div
                      key={person.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3',
                        'border-pink-200 bg-pink-50 dark:border-pink-900 dark:bg-pink-950'
                      )}
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-pink-300 dark:ring-pink-700">
                        <AvatarImage src={person.profileImageUrl} alt={person.name} />
                        <AvatarFallback className="text-xs">
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">{person.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.department} · {person.position}
                        </p>
                      </div>
                      <Cake className="h-5 w-5 text-pink-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming birthdays */}
            {data?.upcoming && data.upcoming.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('widgets.birthdays.upcoming', '다가오는 생일')}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.upcoming.slice(0, 3).map((person) =>
                    renderPersonItem(person, true)
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
