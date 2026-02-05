import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Building2,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Edit,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { OrgHistoryEvent, OrgHistoryEventType } from '../services/organizationService';

interface OrgHistoryTimelineProps {
  events: OrgHistoryEvent[];
  title?: string;
  className?: string;
}

const eventIcons: Record<OrgHistoryEventType, React.ElementType> = {
  department_created: Building2,
  department_deleted: Building2,
  department_renamed: Edit,
  department_moved: GitBranch,
  employee_joined: UserPlus,
  employee_left: UserMinus,
  employee_transferred: ArrowRightLeft,
};

const eventColors: Record<OrgHistoryEventType, string> = {
  department_created: 'bg-green-500',
  department_deleted: 'bg-red-500',
  department_renamed: 'bg-blue-500',
  department_moved: 'bg-purple-500',
  employee_joined: 'bg-green-500',
  employee_left: 'bg-red-500',
  employee_transferred: 'bg-amber-500',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function OrgHistoryTimeline({
  events,
  title = '조직 변경 이력',
  className,
}: OrgHistoryTimelineProps) {
  // Group events by date
  const groupedEvents = events.reduce(
    (acc, event) => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, OrgHistoryEvent[]>
  );

  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            변경 이력이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground sticky top-0 bg-background">
                {format(new Date(dateKey), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
              </h4>
              <div className="relative ml-4 space-y-4 border-l border-muted pl-6">
                {groupedEvents[dateKey].map((event) => {
                  const Icon = eventIcons[event.type];
                  const colorClass = eventColors[event.type];

                  return (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full',
                          colorClass
                        )}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>

                      {/* Event content */}
                      <div className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            {event.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(event.date, 'HH:mm')}
                          </span>
                        </div>

                        {event.actor && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={event.actor.profileImage}
                                alt={event.actor.name}
                              />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(event.actor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{event.actor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default OrgHistoryTimeline;
