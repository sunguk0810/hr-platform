import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Users, Calendar, FileText, Building, Settings, Bell, HelpCircle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Navigation item interface
interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
  children?: NavItem[];
}

// Mock navigation items
const navItems: NavItem[] = [
  { icon: Home, label: '대시보드', path: '/dashboard' },
  { icon: Users, label: '직원 관리', path: '/employees', badge: 5 },
  { icon: Calendar, label: '근태 관리', path: '/attendance' },
  { icon: FileText, label: '결재', path: '/approval', badge: 3 },
  { icon: Building, label: '조직도', path: '/organization' },
  { icon: Bell, label: '알림', path: '/notifications', badge: 12 },
  { icon: BarChart, label: '리포트', path: '/reports' },
  { icon: Settings, label: '설정', path: '/settings' },
  { icon: HelpCircle, label: '도움말', path: '/help' },
];

// Standalone Sidebar component for Storybook
interface MockSidebarProps {
  collapsed?: boolean;
  currentPath?: string;
  onToggle?: () => void;
  onNavigate?: (path: string) => void;
}

function MockSidebar({
  collapsed = false,
  currentPath = '/dashboard',
  onToggle,
  onNavigate,
}: MockSidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-xl font-bold text-primary">HR Platform</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                      )}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && item.badge > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            v0.0.1 &copy; HR Platform
          </p>
        </div>
      )}
    </aside>
  );
}

const meta: Meta<typeof MockSidebar> = {
  title: 'Layout/Sidebar',
  component: MockSidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex h-screen">
          <Story />
          <div className="flex-1 bg-muted/50 p-4">
            <p className="text-muted-foreground">Main Content Area</p>
          </div>
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MockSidebar>;

export const Default: Story = {
  args: {
    collapsed: false,
    currentPath: '/dashboard',
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
    currentPath: '/dashboard',
  },
};

export const EmployeesActive: Story = {
  args: {
    collapsed: false,
    currentPath: '/employees',
  },
};

export const ApprovalActive: Story = {
  args: {
    collapsed: false,
    currentPath: '/approval',
  },
};

export const SettingsActive: Story = {
  args: {
    collapsed: false,
    currentPath: '/settings',
  },
};

export const CollapsedWithBadges: Story = {
  args: {
    collapsed: true,
    currentPath: '/notifications',
  },
};

export const DarkTheme: Story = {
  args: {
    collapsed: false,
    currentPath: '/dashboard',
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  render: () => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [currentPath, setCurrentPath] = React.useState('/dashboard');

    return (
      <MockSidebar
        collapsed={collapsed}
        currentPath={currentPath}
        onToggle={() => setCollapsed(!collapsed)}
        onNavigate={setCurrentPath}
      />
    );
  },
};

// Need to import React for the interactive story
import React from 'react';
