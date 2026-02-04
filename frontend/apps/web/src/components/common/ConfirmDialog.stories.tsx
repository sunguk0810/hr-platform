import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Common/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  args: {
    open: true,
    title: '확인',
    description: '이 작업을 진행하시겠습니까?',
    onConfirm: () => console.log('Confirmed'),
    onOpenChange: () => {},
  },
};

export const Destructive: Story = {
  args: {
    open: true,
    title: '삭제 확인',
    description: '이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    variant: 'destructive',
    confirmLabel: '삭제',
    cancelLabel: '취소',
    onConfirm: () => console.log('Deleted'),
    onOpenChange: () => {},
  },
};

export const Loading: Story = {
  args: {
    open: true,
    title: '처리 중',
    description: '요청을 처리하고 있습니다...',
    isLoading: true,
    onConfirm: () => {},
    onOpenChange: () => {},
  },
};

export const CustomLabels: Story = {
  args: {
    open: true,
    title: '로그아웃',
    description: '정말 로그아웃하시겠습니까?',
    confirmLabel: '로그아웃',
    cancelLabel: '계속 사용',
    onConfirm: () => console.log('Logged out'),
    onOpenChange: () => {},
  },
};

export const WithoutDescription: Story = {
  args: {
    open: true,
    title: '저장하시겠습니까?',
    onConfirm: () => console.log('Saved'),
    onOpenChange: () => {},
  },
};

// Interactive example
export const Interactive: StoryObj = {
  render: function Interactive() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 1500);
    };

    return (
      <div>
        <Button onClick={() => setOpen(true)}>다이얼로그 열기</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="작업 확인"
          description="이 작업을 진행하시겠습니까?"
          confirmLabel="확인"
          cancelLabel="취소"
          onConfirm={handleConfirm}
          isLoading={loading}
        />
      </div>
    );
  },
};

// Destructive Interactive example
export const DestructiveInteractive: StoryObj = {
  render: function DestructiveInteractive() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
        alert('삭제되었습니다.');
      }, 1500);
    };

    return (
      <div>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          삭제
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="삭제 확인"
          description="이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          variant="destructive"
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleConfirm}
          isLoading={loading}
        />
      </div>
    );
  },
};
