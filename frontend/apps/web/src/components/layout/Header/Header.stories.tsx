import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Create a standalone Header component for Storybook that doesn't depend on stores
interface MockHeaderProps {
  userName?: string;
  userEmail?: string;
  userDepartment?: string;
  userPosition?: string;
  userAvatar?: string;
  tenantName?: string;
  unreadCount?: number;
  theme?: 'light' | 'dark';
  sidebarCollapsed?: boolean;
  onThemeToggle?: () => void;
  onSidebarToggle?: () => void;
  onNotificationClick?: () => void;
  onLogout?: () => void;
}

function MockHeader({
  userName = '홍길동',
  userEmail = 'hong@company.com',
  userDepartment = '개발팀',
  userPosition = '선임',
  userAvatar,
  tenantName = 'HR 플랫폼',
  unreadCount = 3,
  theme = 'light',
  sidebarCollapsed = false,
  onThemeToggle,
  onSidebarToggle,
  onNotificationClick,
  onLogout,
}: MockHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {tenantName && (
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-sm font-medium text-muted-foreground">
              {tenantName}
            </span>
          </div>
        )}

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="검색..."
            className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onThemeToggle}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userDepartment} / {userPosition}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>내 정보</DropdownMenuItem>
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

const queryClient = new QueryClient();

const meta: Meta<typeof MockHeader> = {
  title: 'Layout/Header',
  component: MockHeader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="min-h-[100px]">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MockHeader>;

export const Default: Story = {
  args: {
    userName: '홍길동',
    userEmail: 'hong@company.com',
    userDepartment: '개발팀',
    userPosition: '선임',
    tenantName: 'HR 플랫폼',
    unreadCount: 3,
    theme: 'light',
    sidebarCollapsed: false,
  },
};

export const NoNotifications: Story = {
  args: {
    userName: '김철수',
    userEmail: 'kim@company.com',
    userDepartment: '디자인팀',
    userPosition: '책임',
    unreadCount: 0,
  },
};

export const ManyNotifications: Story = {
  args: {
    userName: '이영희',
    userEmail: 'lee@company.com',
    userDepartment: '마케팅팀',
    userPosition: '과장',
    unreadCount: 15,
  },
};

export const DarkTheme: Story = {
  args: {
    userName: '박민수',
    userEmail: 'park@company.com',
    userDepartment: '영업팀',
    userPosition: '부장',
    theme: 'dark',
    unreadCount: 5,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background">
        <Story />
      </div>
    ),
  ],
};

export const CollapsedSidebar: Story = {
  args: {
    userName: '홍길동',
    userEmail: 'hong@company.com',
    userDepartment: '개발팀',
    userPosition: '선임',
    sidebarCollapsed: true,
    unreadCount: 2,
  },
};

export const WithAvatar: Story = {
  args: {
    userName: '최지원',
    userEmail: 'choi@company.com',
    userDepartment: '인사팀',
    userPosition: '대리',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    unreadCount: 1,
  },
};

export const LongTenantName: Story = {
  args: {
    userName: '홍길동',
    userEmail: 'hong@company.com',
    userDepartment: '개발팀',
    userPosition: '선임',
    tenantName: '(주)대한민국 종합 인사관리 시스템',
    unreadCount: 0,
  },
};
