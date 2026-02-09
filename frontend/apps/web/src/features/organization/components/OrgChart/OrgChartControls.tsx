import { useState, useCallback } from 'react';
import { useReactFlow, Panel } from 'reactflow';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths, isAfter, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface OrgChartControlsProps {
  onExport?: () => void;
  onToggleView?: () => void;
  viewMode?: 'tree' | 'flat';
  onDateChange?: (date: Date) => void;
  selectedDate?: Date;
  historyDates?: Date[];
  className?: string;
}

export function OrgChartControls({
  onExport,
  onToggleView,
  viewMode = 'tree',
  onDateChange,
  selectedDate,
  historyDates = [],
  className,
}: OrgChartControlsProps) {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { t } = useTranslation('organization');

  const today = startOfDay(new Date());
  const minDate = subMonths(today, 24); // 2년 전까지
  const currentDate = selectedDate || today;

  const handleReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handlePrevMonth = useCallback(() => {
    if (!onDateChange) return;
    const newDate = subMonths(currentDate, 1);
    if (!isBefore(newDate, minDate)) {
      onDateChange(newDate);
    }
  }, [currentDate, minDate, onDateChange]);

  const handleNextMonth = useCallback(() => {
    if (!onDateChange) return;
    const newDate = addMonths(currentDate, 1);
    if (!isAfter(newDate, today)) {
      onDateChange(newDate);
    }
  }, [currentDate, today, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange?.(today);
  }, [today, onDateChange]);

  // Calculate slider value (0-24 representing months from minDate)
  const monthsDiff = Math.round(
    (currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const sliderValue = Math.max(0, Math.min(24, monthsDiff));

  const handleSliderChange = useCallback(
    (value: number[]) => {
      if (!onDateChange) return;
      const months = value[0];
      const newDate = addMonths(minDate, months);
      if (!isAfter(newDate, today)) {
        onDateChange(newDate);
      }
    },
    [minDate, today, onDateChange]
  );

  const handleHistoryDateClick = useCallback(
    (date: Date) => {
      onDateChange?.(date);
      setIsHistoryOpen(false);
    },
    [onDateChange]
  );

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  return (
    <>
      {/* Date selector panel at top */}
      {onDateChange && (
        <Panel position="top-center" className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handlePrevMonth}
                    disabled={isBefore(subMonths(currentDate, 1), minDate)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('orgChart.controls.prevMonth')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'min-w-[140px] justify-center gap-2',
                    !isToday && 'border-primary text-primary'
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  {format(currentDate, 'yyyy년 M월', { locale: ko })}
                  {!isToday && (
                    <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                      {t('orgChart.controls.past')}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="center">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{t('orgChart.controls.pointInTime')}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToday}
                      disabled={isToday}
                    >
                      {t('orgChart.controls.goToToday')}
                    </Button>
                  </div>

                  {/* Slider for date selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(minDate, 'yyyy.MM')}</span>
                      <span className="font-medium text-foreground">
                        {format(currentDate, 'yyyy년 M월')}
                      </span>
                      <span>{format(today, 'yyyy.MM')}</span>
                    </div>
                    <Slider
                      value={[sliderValue]}
                      onValueChange={handleSliderChange}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      {t('orgChart.controls.dragToSelect')}
                    </p>
                  </div>

                  {/* History dates quick access */}
                  {historyDates.length > 0 && (
                    <>
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('orgChart.controls.orgHistory')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {historyDates.slice(0, 6).map((date) => (
                            <Button
                              key={date.toISOString()}
                              variant="outline"
                              size="sm"
                              className={cn(
                                'text-xs h-7',
                                format(date, 'yyyy-MM') ===
                                  format(currentDate, 'yyyy-MM') &&
                                  'bg-primary text-primary-foreground'
                              )}
                              onClick={() => handleHistoryDateClick(date)}
                            >
                              {format(date, 'yy.MM')}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNextMonth}
                    disabled={isAfter(addMonths(currentDate, 1), today)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('orgChart.controls.nextMonth')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!isToday && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-1 text-xs"
                      onClick={handleToday}
                    >
                      {t('orgChart.controls.today')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('orgChart.controls.goToToday')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </Panel>
      )}

      {/* Zoom and view controls at bottom right */}
      <Panel position="bottom-right" className={cn('flex flex-col gap-1', className)}>
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-col gap-1 rounded-lg border bg-background p-1 shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => zoomIn({ duration: 200 })}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('orgChart.controls.zoomIn')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => zoomOut({ duration: 200 })}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('orgChart.controls.zoomOut')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFitView}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('orgChart.controls.fitView')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('orgChart.controls.resetView')}</TooltipContent>
            </Tooltip>

            {onToggleView && (
              <>
                <div className="my-1 border-t" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={onToggleView}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {viewMode === 'tree' ? t('orgChart.controls.flatView') : t('orgChart.controls.treeView')}
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {onExport && (
              <>
                <div className="my-1 border-t" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{t('orgChart.controls.saveImage')}</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </Panel>
    </>
  );
}

export default OrgChartControls;
