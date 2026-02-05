import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type WidgetType =
  | 'attendance'
  | 'leaveBalance'
  | 'pendingApprovals'
  | 'recentNotifications'
  | 'teamCalendar'
  | 'quickLinks'
  | 'orgSummary'
  | 'statistics'
  | 'announcements'
  | 'birthdays'
  | 'teamLeave';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  order: number;
  size: 'sm' | 'md' | 'lg';
}

interface DashboardState {
  widgets: WidgetConfig[];
  isEditMode: boolean;

  // Actions
  setWidgets: (widgets: WidgetConfig[]) => void;
  reorderWidgets: (newOrder: string[]) => void;
  toggleWidget: (id: string) => void;
  updateWidgetSize: (id: string, size: WidgetConfig['size']) => void;
  resetToDefault: () => void;
  setEditMode: (isEditMode: boolean) => void;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'attendance', type: 'attendance', title: '출퇴근', enabled: true, order: 0, size: 'md' },
  { id: 'leaveBalance', type: 'leaveBalance', title: '휴가 현황', enabled: true, order: 1, size: 'md' },
  { id: 'pendingApprovals', type: 'pendingApprovals', title: '결재 대기', enabled: true, order: 2, size: 'md' },
  { id: 'orgSummary', type: 'orgSummary', title: '조직 현황', enabled: true, order: 3, size: 'md' },
  { id: 'statistics', type: 'statistics', title: '통계', enabled: true, order: 4, size: 'md' },
  { id: 'announcements', type: 'announcements', title: '공지사항', enabled: true, order: 5, size: 'lg' },
  { id: 'birthdays', type: 'birthdays', title: '생일', enabled: true, order: 6, size: 'md' },
  { id: 'teamLeave', type: 'teamLeave', title: '팀원 휴가', enabled: true, order: 7, size: 'lg' },
  { id: 'recentNotifications', type: 'recentNotifications', title: '최근 알림', enabled: false, order: 8, size: 'md' },
  { id: 'teamCalendar', type: 'teamCalendar', title: '팀 캘린더', enabled: false, order: 9, size: 'lg' },
  { id: 'quickLinks', type: 'quickLinks', title: '빠른 링크', enabled: false, order: 10, size: 'sm' },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      isEditMode: false,

      setWidgets: (widgets) => set({ widgets }),

      reorderWidgets: (newOrder) => {
        set((state) => ({
          widgets: state.widgets.map((widget) => ({
            ...widget,
            order: newOrder.indexOf(widget.id),
          })).sort((a, b) => a.order - b.order),
        }));
      },

      toggleWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
          ),
        }));
      },

      updateWidgetSize: (id, size) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, size } : widget
          ),
        }));
      },

      resetToDefault: () => set({ widgets: defaultWidgets }),

      setEditMode: (isEditMode) => set({ isEditMode }),
    }),
    {
      name: 'hr-platform-dashboard',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: state.widgets,
      }),
    }
  )
);
