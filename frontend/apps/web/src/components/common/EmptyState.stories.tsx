import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Search, FileX, Users, Calendar, FolderOpen, Bell } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: '데이터가 없습니다',
  },
};

export const WithDescription: Story = {
  args: {
    title: '데이터가 없습니다',
    description: '새로운 항목을 추가하여 시작하세요.',
  },
};

export const WithAction: Story = {
  args: {
    title: '항목이 없습니다',
    description: '새 항목을 추가해보세요.',
    action: {
      label: '새로 만들기',
      onClick: () => console.log('Action clicked'),
    },
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: Search,
    title: '검색 결과가 없습니다',
    description: '다른 검색어로 시도하거나 필터를 조정해보세요.',
  },
};

export const NoFiles: Story = {
  args: {
    icon: FileX,
    title: '파일이 없습니다',
    description: '파일을 업로드하여 시작하세요.',
    action: {
      label: '파일 업로드',
      onClick: () => console.log('Upload clicked'),
    },
  },
};

export const NoEmployees: Story = {
  args: {
    icon: Users,
    title: '직원이 없습니다',
    description: '첫 번째 직원을 등록해보세요.',
    action: {
      label: '직원 등록',
      onClick: () => console.log('Register clicked'),
    },
  },
};

export const NoEvents: Story = {
  args: {
    icon: Calendar,
    title: '예정된 일정이 없습니다',
    description: '새 일정을 추가하여 캘린더를 채워보세요.',
    action: {
      label: '일정 추가',
      onClick: () => console.log('Add event clicked'),
    },
  },
};

export const EmptyFolder: Story = {
  args: {
    icon: FolderOpen,
    title: '폴더가 비어있습니다',
    description: '이 폴더에 파일을 추가하거나 새 폴더를 만드세요.',
  },
};

export const NoNotifications: Story = {
  args: {
    icon: Bell,
    title: '알림이 없습니다',
    description: '새로운 알림이 있으면 여기에 표시됩니다.',
  },
};

export const CustomClassName: Story = {
  args: {
    title: '커스텀 스타일',
    description: '배경색과 패딩이 적용된 예제입니다.',
    className: 'bg-muted/50 rounded-lg',
  },
};

export const AnimationDemo: Story = {
  args: {
    icon: Users,
    title: '애니메이션 데모',
    description: '아이콘이 회전하며 나타나고, 텍스트가 순차적으로 페이드됩니다.',
    action: {
      label: '다시 보기',
      onClick: () => window.location.reload(),
    },
  },
};

// All icons example
export const AllIcons: StoryObj = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <EmptyState
        icon={Search}
        title="검색 결과 없음"
        description="검색어를 확인해주세요."
      />
      <EmptyState
        icon={FileX}
        title="파일 없음"
        description="파일을 업로드해주세요."
      />
      <EmptyState
        icon={Users}
        title="사용자 없음"
        description="사용자를 초대해주세요."
      />
      <EmptyState
        icon={Calendar}
        title="일정 없음"
        description="일정을 추가해주세요."
      />
    </div>
  ),
};
