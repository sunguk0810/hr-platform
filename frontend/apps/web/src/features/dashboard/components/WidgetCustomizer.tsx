import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings2,
  GripVertical,
  RotateCcw,
  Clock,
  Calendar,
  FileCheck,
  Bell,
  Users,
  Link2,
  LayoutGrid,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  useDashboardStore,
  type WidgetConfig,
  type WidgetType,
} from '@/stores/dashboardStore';

const widgetIcons: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  attendance: Clock,
  leaveBalance: Calendar,
  pendingApprovals: FileCheck,
  recentNotifications: Bell,
  teamCalendar: Users,
  quickLinks: Link2,
};

const widgetDescriptions: Record<WidgetType, string> = {
  attendance: '오늘의 출퇴근 상태와 버튼',
  leaveBalance: '남은 휴가 일수 및 현황',
  pendingApprovals: '대기 중인 결재 목록',
  recentNotifications: '최근 알림 목록',
  teamCalendar: '팀원 휴가/일정 캘린더',
  quickLinks: '자주 사용하는 기능 바로가기',
};

const sizeLabels: Record<WidgetConfig['size'], string> = {
  sm: '작게',
  md: '보통',
  lg: '크게',
};

interface SortableWidgetCardProps {
  widget: WidgetConfig;
  onToggle: (id: string) => void;
  onSizeChange: (id: string, size: WidgetConfig['size']) => void;
  isDragging?: boolean;
}

function SortableWidgetCard({
  widget,
  onToggle,
  onSizeChange,
  isDragging,
}: SortableWidgetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = widgetIcons[widget.type];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all',
        (isDragging || isSortableDragging) && 'opacity-50 scale-[1.02] shadow-lg',
        !widget.enabled && 'bg-muted/50'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Drag Handle with keyboard support */}
          <button
            type="button"
            className={cn(
              'cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing mt-0.5',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded'
            )}
            aria-label={`${widget.title} 위젯 순서 변경. 스페이스바를 눌러 드래그 시작`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Widget Icon */}
          <div
            className={cn(
              'flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center',
              widget.enabled ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                widget.enabled ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          {/* Widget Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'font-medium',
                  !widget.enabled && 'text-muted-foreground'
                )}
              >
                {widget.title}
              </span>
              <Switch
                checked={widget.enabled}
                onCheckedChange={() => onToggle(widget.id)}
                aria-label={`${widget.title} ${widget.enabled ? '비활성화' : '활성화'}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {widgetDescriptions[widget.type]}
            </p>

            {widget.enabled && (
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor={`size-${widget.id}`} className="text-xs">
                  크기:
                </Label>
                <Select
                  value={widget.size}
                  onValueChange={(value) =>
                    onSizeChange(widget.id, value as WidgetConfig['size'])
                  }
                >
                  <SelectTrigger id={`size-${widget.id}`} className="h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">{sizeLabels.sm}</SelectItem>
                    <SelectItem value="md">{sizeLabels.md}</SelectItem>
                    <SelectItem value="lg">{sizeLabels.lg}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Drag overlay component for visual feedback during drag
function DragOverlayCard({ widget }: { widget: WidgetConfig }) {
  const Icon = widgetIcons[widget.type];

  return (
    <Card className="shadow-xl ring-2 ring-primary bg-background">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-1 text-primary mt-0.5">
            <GripVertical className="h-4 w-4" />
          </div>
          <div
            className={cn(
              'flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center',
              widget.enabled ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                widget.enabled ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium">{widget.title}</span>
            <p className="text-xs text-muted-foreground">
              {widgetDescriptions[widget.type]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface WidgetCustomizerProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function WidgetCustomizer({ trigger, className }: WidgetCustomizerProps) {
  const { widgets, toggleWidget, updateWidgetSize, reorderWidgets, resetToDefault } =
    useDashboardStore();
  const [open, setOpen] = React.useState(false);
  const [localWidgets, setLocalWidgets] = React.useState<WidgetConfig[]>(widgets);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Sensors for mouse/touch and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    if (open) {
      setLocalWidgets([...widgets].sort((a, b) => a.order - b.order));
    }
  }, [open, widgets]);

  const handleToggle = (id: string) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleSizeChange = (id: string, size: WidgetConfig['size']) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size } : w))
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setLocalWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, order: idx }));
      });
    }
  };

  const handleSave = () => {
    // Apply changes to store
    localWidgets.forEach((w) => {
      const original = widgets.find((ow) => ow.id === w.id);
      if (original) {
        if (original.enabled !== w.enabled) {
          toggleWidget(w.id);
        }
        if (original.size !== w.size) {
          updateWidgetSize(w.id, w.size);
        }
      }
    });

    // Reorder
    const newOrder = localWidgets.map((w) => w.id);
    reorderWidgets(newOrder);

    setOpen(false);
  };

  const handleReset = () => {
    resetToDefault();
    setOpen(false);
  };

  const enabledCount = localWidgets.filter((w) => w.enabled).length;
  const activeWidget = activeId
    ? localWidgets.find((w) => w.id === activeId)
    : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <Settings2 className="mr-2 h-4 w-4" />
            위젯 설정
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            대시보드 위젯 설정
          </SheetTitle>
          <SheetDescription>
            대시보드에 표시할 위젯을 선택하고 순서를 변경할 수 있습니다.
            <br />
            <span className="text-xs">
              키보드: Tab으로 이동, Space로 드래그 시작, 화살표로 이동, Space로 놓기
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {enabledCount}개 위젯 활성화
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-3 w-3" />
              초기화
            </Button>
          </div>

          <Separator className="mb-4" />

          <ScrollArea className="h-[calc(100vh-280px)]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localWidgets.map((w) => w.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="space-y-2 pr-4"
                  role="listbox"
                  aria-label="위젯 목록"
                >
                  {localWidgets.map((widget) => (
                    <SortableWidgetCard
                      key={widget.id}
                      widget={widget}
                      onToggle={handleToggle}
                      onSizeChange={handleSizeChange}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeWidget ? <DragOverlayCard widget={activeWidget} /> : null}
              </DragOverlay>
            </DndContext>
          </ScrollArea>
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>변경사항 저장</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Compact toggle buttons for toolbar
export interface WidgetQuickToggleProps {
  className?: string;
}

export function WidgetQuickToggle({ className }: WidgetQuickToggleProps) {
  const { widgets, toggleWidget } = useDashboardStore();

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {widgets.map((widget) => {
        const Icon = widgetIcons[widget.type];
        return (
          <Button
            key={widget.id}
            variant={widget.enabled ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleWidget(widget.id)}
            className={cn('h-8 px-2', !widget.enabled && 'opacity-60')}
            title={`${widget.title} ${widget.enabled ? '숨기기' : '표시'}`}
          >
            <Icon className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">{widget.title}</span>
            {widget.enabled ? (
              <Eye className="h-3 w-3 ml-1" />
            ) : (
              <EyeOff className="h-3 w-3 ml-1" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Preview card for widget selection
export interface WidgetPreviewCardProps {
  type: WidgetType;
  title: string;
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function WidgetPreviewCard({
  type,
  title,
  enabled,
  onToggle,
  className,
}: WidgetPreviewCardProps) {
  const Icon = widgetIcons[type];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        enabled && 'ring-2 ring-primary',
        className
      )}
      onClick={onToggle}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {widgetDescriptions[type]}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs font-medium',
              enabled ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {enabled ? '표시 중' : '숨김'}
          </span>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardContent>
    </Card>
  );
}
