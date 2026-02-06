import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, BarChart3, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryClient';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLeaveCalendar } from '../hooks/useAttendance';
import type { LeaveCalendarEvent, LeaveType } from '@hr-platform/shared-types';

type ViewMode = 'month' | 'week' | 'gantt';

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  ANNUAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SICK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SPECIAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  HALF_DAY_AM: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  HALF_DAY_PM: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  HOURLY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  MATERNITY: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  PATERNITY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  UNPAID: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: '연차',
  SICK: '병가',
  SPECIAL: '특별휴가',
  HALF_DAY_AM: '반차(오전)',
  HALF_DAY_PM: '반차(오후)',
  HOURLY: '시간차',
  MATERNITY: '출산휴가',
  PATERNITY: '배우자출산휴가',
  UNPAID: '무급휴가',
};

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  events: LeaveCalendarEvent[];
}

function CalendarDay({ date, isCurrentMonth, events }: CalendarDayProps) {
  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    return date >= eventStart && date <= eventEnd;
  });

  return (
    <div
      className={`min-h-[100px] p-1 border-r border-b ${
        !isCurrentMonth ? 'bg-muted/30' : ''
      } ${isToday(date) ? 'bg-primary/5' : ''}`}
    >
      <div
        className={`text-sm font-medium mb-1 ${
          !isCurrentMonth ? 'text-muted-foreground' : ''
        } ${isToday(date) ? 'text-primary' : ''}`}
      >
        {format(date, 'd')}
      </div>
      <div className="space-y-0.5">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className={`text-xs px-1 py-0.5 rounded truncate ${LEAVE_TYPE_COLORS[event.leaveType]}`}
            title={`${event.employeeName} - ${LEAVE_TYPE_LABELS[event.leaveType]}`}
          >
            {event.employeeName}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-muted-foreground px-1">
            +{dayEvents.length - 3}명
          </div>
        )}
      </div>
    </div>
  );
}

interface GanttRowProps {
  event: LeaveCalendarEvent;
  startDate: Date;
  endDate: Date;
}

function GanttRow({ event, startDate, endDate }: GanttRowProps) {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  const startOffset = Math.max(0, Math.ceil((eventStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const duration = Math.min(
    Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    totalDays - startOffset
  );

  const leftPercent = (startOffset / totalDays) * 100;
  const widthPercent = (duration / totalDays) * 100;

  return (
    <div className="flex items-center border-b py-2">
      <div className="w-32 shrink-0 px-2 text-sm font-medium truncate">
        {event.employeeName}
      </div>
      <div className="w-24 shrink-0 px-2 text-xs text-muted-foreground truncate">
        {event.departmentName}
      </div>
      <div className="flex-1 relative h-6">
        <div
          className={`absolute h-5 rounded ${LEAVE_TYPE_COLORS[event.leaveType]}`}
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
        >
          <span className="text-xs px-1 truncate block">
            {LEAVE_TYPE_LABELS[event.leaveType]}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LeaveCalendarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ko });
  const calendarEnd = endOfWeek(monthEnd, { locale: ko });

  const { data: leaveData, isLoading } = useLeaveCalendar({
    startDate: format(calendarStart, 'yyyy-MM-dd'),
    endDate: format(calendarEnd, 'yyyy-MM-dd'),
    departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
  });

  const events = leaveData?.data ?? [];

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Mock departments for filter
  const departments = [
    { id: 'all', name: '전체 부서' },
    { id: 'dept-001', name: '개발본부' },
    { id: 'dept-002', name: '프론트엔드팀' },
    { id: 'dept-003', name: '백엔드팀' },
    { id: 'dept-005', name: '인사팀' },
  ];

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
  };

  // Get today's leaves for mobile view
  const todayEvents = events.filter((event) => {
    const today = new Date();
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    return today >= eventStart && today <= eventEnd;
  });

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">휴가 캘린더</h1>
              <p className="text-sm text-muted-foreground">팀 휴가 일정</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleToday}>
              오늘
            </Button>
          </div>

          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="부서 선택" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Today's Leave Summary */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">오늘 휴가자</h3>
              <span className="ml-auto text-lg font-bold text-primary">{todayEvents.length}명</span>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                오늘 휴가자가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {todayEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{event.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{event.departmentName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${LEAVE_TYPE_COLORS[event.leaveType]}`}>
                      {LEAVE_TYPE_LABELS[event.leaveType]}
                    </span>
                  </div>
                ))}
                {todayEvents.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{todayEvents.length - 5}명 더
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Monthly Stats */}
          <div className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-sm mb-3">이번 달 현황</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <p className="text-2xl font-bold text-primary">{events.length}</p>
                <p className="text-xs text-muted-foreground">총 휴가</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{events.filter((e) => e.leaveType === 'ANNUAL').length}</p>
                <p className="text-xs text-muted-foreground">연차</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{events.filter((e) => e.leaveType === 'SICK').length}</p>
                <p className="text-xs text-muted-foreground">병가</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{events.filter((e) => e.leaveType === 'SPECIAL').length}</p>
                <p className="text-xs text-muted-foreground">특별휴가</p>
              </div>
            </div>
          </div>

          {/* Mobile Calendar - Simplified List View */}
          <div className="bg-card rounded-2xl border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">휴가 일정</h3>
            </div>
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                이번 달 휴가 일정이 없습니다
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {event.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDate), 'M/d')} - {format(new Date(event.endDate), 'M/d')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${LEAVE_TYPE_COLORS[event.leaveType]}`}>
                      {LEAVE_TYPE_LABELS[event.leaveType]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 px-1">
            {Object.entries(LEAVE_TYPE_LABELS).slice(0, 4).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded ${LEAVE_TYPE_COLORS[type as LeaveType]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="휴가 캘린더"
        description="팀원들의 휴가 일정을 확인합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            근태관리
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                오늘
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-2">
                {format(currentDate, 'yyyy년 M월', { locale: ko })}
              </h2>
            </div>

            {/* Filters and View Toggle */}
            <div className="flex items-center gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('month')}
                  title="월간 뷰"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('gantt')}
                  title="Gantt 뷰"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3">
            {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded ${LEAVE_TYPE_COLORS[type as LeaveType]}`}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      ) : viewMode === 'month' ? (
        /* Monthly Calendar View */
        <Card>
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`p-2 text-center text-sm font-medium ${
                    index === 0
                      ? 'text-red-500'
                      : index === 6
                      ? 'text-blue-500'
                      : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date) => (
                <CalendarDay
                  key={date.toISOString()}
                  date={date}
                  isCurrentMonth={isSameMonth(date, currentDate)}
                  events={events}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Gantt View */
        <Card>
          <CardContent className="p-0">
            {/* Gantt Header */}
            <div className="flex border-b bg-muted/50">
              <div className="w-32 shrink-0 px-2 py-2 text-sm font-medium">이름</div>
              <div className="w-24 shrink-0 px-2 py-2 text-sm font-medium">부서</div>
              <div className="flex-1 flex">
                {eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => (
                  <div
                    key={date.toISOString()}
                    className={`flex-1 text-center text-xs py-2 border-l ${
                      isToday(date) ? 'bg-primary/10' : ''
                    } ${getDay(date) === 0 ? 'text-red-500' : getDay(date) === 6 ? 'text-blue-500' : ''}`}
                  >
                    {format(date, 'd')}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="max-h-[500px] overflow-auto">
              {events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  이번 달 휴가 일정이 없습니다.
                </div>
              ) : (
                events.map((event) => (
                  <GanttRow
                    key={event.id}
                    event={event}
                    startDate={monthStart}
                    endDate={monthEnd}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">이번 달 휴가 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <div className="text-sm text-muted-foreground">총 휴가 건수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.filter((e) => e.leaveType === 'ANNUAL').length}
              </div>
              <div className="text-sm text-muted-foreground">연차</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {events.filter((e) => e.leaveType === 'SICK').length}
              </div>
              <div className="text-sm text-muted-foreground">병가</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter((e) => e.leaveType === 'SPECIAL').length}
              </div>
              <div className="text-sm text-muted-foreground">특별휴가</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
