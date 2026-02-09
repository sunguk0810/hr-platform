import { useQuery } from '@tanstack/react-query';
import { Megaphone, ChevronRight, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WidgetContainer } from './WidgetContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  category: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned: boolean;
  createdAt: string;
  author: {
    name: string;
    department: string;
  };
}

interface AnnouncementsData {
  announcements: Announcement[];
  totalCount: number;
}

const categoryColors: Record<Announcement['category'], string> = {
  NOTICE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  EVENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  UPDATE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export function AnnouncementsWidget() {
  const { t, i18n } = useTranslation('dashboard');
  const locale = i18n.language === 'ko' ? ko : enUS;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.announcements(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AnnouncementsData }>(
        '/dashboard/announcements',
        { params: { limit: 5 } }
      );
      return response.data.data;
    },
  });

  const getCategoryLabel = (category: Announcement['category']) => {
    const labels: Record<Announcement['category'], string> = {
      NOTICE: t('widgets.announcements.category.notice'),
      EVENT: t('widgets.announcements.category.event'),
      UPDATE: t('widgets.announcements.category.update'),
      URGENT: t('widgets.announcements.category.urgent'),
    };
    return labels[category];
  };

  return (
    <WidgetContainer
      title={t('widgets.announcements.title')}
      isLoading={isLoading}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/announcements">
            {t('widgets.announcements.viewAll')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {data?.announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Megaphone className="mb-2 h-8 w-8" />
            <p className="text-sm">
              {t('widgets.announcements.empty')}
            </p>
          </div>
        ) : (
          data?.announcements.map((announcement) => (
            <Link
              key={announcement.id}
              to={`/announcements/${announcement.id}`}
              className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start gap-2">
                {announcement.isPinned && (
                  <Pin className="mt-0.5 h-4 w-4 text-orange-500" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        categoryColors[announcement.category]
                      )}
                    >
                      {getCategoryLabel(announcement.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'line-clamp-1 text-sm',
                      announcement.isPinned && 'font-medium'
                    )}
                  >
                    {announcement.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {announcement.author.name} · {announcement.author.department}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </WidgetContainer>
  );
}
