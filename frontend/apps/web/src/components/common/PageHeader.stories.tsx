import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Download, Settings } from 'lucide-react';

const meta: Meta<typeof PageHeader> = {
  title: 'Common/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: '페이지 제목',
  },
};

export const WithDescription: Story = {
  args: {
    title: '직원 관리',
    description: '전체 직원 목록을 조회하고 관리합니다.',
  },
};

export const WithSingleAction: Story = {
  args: {
    title: '직원 관리',
    description: '전체 직원 목록을 조회하고 관리합니다.',
    actions: (
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        직원 등록
      </Button>
    ),
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: '직원 관리',
    description: '전체 직원 목록을 조회하고 관리합니다.',
    actions: (
      <>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          직원 등록
        </Button>
      </>
    ),
  },
};

export const WithIconActions: Story = {
  args: {
    title: '설정',
    description: '시스템 설정을 관리합니다.',
    actions: (
      <Button variant="ghost" size="icon">
        <Settings className="h-5 w-5" />
      </Button>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: '2024년 1분기 근태 현황 보고서 및 통계 분석 대시보드',
    description: '상세한 분석 데이터와 함께 근태 현황을 확인하세요.',
  },
};

export const LongDescription: Story = {
  args: {
    title: '결재 관리',
    description:
      '결재 요청을 조회하고 승인 또는 반려할 수 있습니다. 대기 중인 결재와 완료된 결재 내역을 확인하고, 새로운 결재를 요청할 수 있습니다.',
  },
};

export const AllVariations: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <PageHeader title="제목만 있는 경우" />

      <PageHeader
        title="설명이 있는 경우"
        description="페이지에 대한 간단한 설명입니다."
      />

      <PageHeader
        title="액션 버튼이 있는 경우"
        description="오른쪽에 액션 버튼이 표시됩니다."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새로 만들기
          </Button>
        }
      />

      <PageHeader
        title="여러 액션이 있는 경우"
        description="여러 개의 액션 버튼을 표시할 수 있습니다."
        actions={
          <>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              설정
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          </>
        }
      />
    </div>
  ),
};
