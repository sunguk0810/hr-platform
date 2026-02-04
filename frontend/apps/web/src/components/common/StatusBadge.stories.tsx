import type { Meta, StoryObj } from '@storybook/react';
import {
  StatusBadge,
  ApprovalStatusBadge,
  EmploymentStatusBadge,
  LeaveStatusBadge,
  AttendanceStatusBadge,
  TenantStatusBadge,
  LeaveTypeBadge,
} from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Common/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'pending', 'default'],
    },
    dot: { control: 'boolean' },
    pulse: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  args: {
    status: 'default',
    label: '기본',
  },
};

export const Success: Story = {
  args: {
    status: 'success',
    label: '성공',
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    label: '경고',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    label: '오류',
  },
};

export const Info: Story = {
  args: {
    status: 'info',
    label: '정보',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
    label: '대기중',
  },
};

export const WithDot: Story = {
  args: {
    status: 'success',
    label: '활성',
    dot: true,
  },
};

export const WithPulse: Story = {
  args: {
    status: 'pending',
    label: '처리중',
    dot: true,
    pulse: true,
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="success" label="성공" />
      <StatusBadge status="warning" label="경고" />
      <StatusBadge status="error" label="오류" />
      <StatusBadge status="info" label="정보" />
      <StatusBadge status="pending" label="대기" />
      <StatusBadge status="default" label="기본" />
    </div>
  ),
};

export const AllWithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="success" label="성공" dot />
      <StatusBadge status="warning" label="경고" dot />
      <StatusBadge status="error" label="오류" dot />
      <StatusBadge status="info" label="정보" dot />
      <StatusBadge status="pending" label="대기" dot />
      <StatusBadge status="default" label="기본" dot />
    </div>
  ),
};

// Preset Components Stories
export const ApprovalStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ApprovalStatusBadge status="DRAFT" />
      <ApprovalStatusBadge status="PENDING" />
      <ApprovalStatusBadge status="APPROVED" />
      <ApprovalStatusBadge status="REJECTED" />
      <ApprovalStatusBadge status="CANCELLED" />
    </div>
  ),
};

export const EmploymentStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <EmploymentStatusBadge status="ACTIVE" />
      <EmploymentStatusBadge status="ON_LEAVE" />
      <EmploymentStatusBadge status="RESIGNED" />
      <EmploymentStatusBadge status="RETIRED" />
      <EmploymentStatusBadge status="SUSPENDED" />
    </div>
  ),
};

export const LeaveStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <LeaveStatusBadge status="PENDING" />
      <LeaveStatusBadge status="APPROVED" />
      <LeaveStatusBadge status="REJECTED" />
      <LeaveStatusBadge status="CANCELLED" />
    </div>
  ),
};

export const AttendanceStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <AttendanceStatusBadge status="NORMAL" />
      <AttendanceStatusBadge status="LATE" />
      <AttendanceStatusBadge status="EARLY_LEAVE" />
      <AttendanceStatusBadge status="ABSENT" />
      <AttendanceStatusBadge status="HOLIDAY" />
      <AttendanceStatusBadge status="WEEKEND" />
      <AttendanceStatusBadge status="LEAVE" />
      <AttendanceStatusBadge status="OVERTIME" />
    </div>
  ),
};

export const TenantStatuses: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TenantStatusBadge status="ACTIVE" />
      <TenantStatusBadge status="INACTIVE" />
      <TenantStatusBadge status="SUSPENDED" />
      <TenantStatusBadge status="PENDING" />
    </div>
  ),
};

export const LeaveTypes: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <LeaveTypeBadge type="ANNUAL" />
      <LeaveTypeBadge type="SICK" />
      <LeaveTypeBadge type="SPECIAL" />
      <LeaveTypeBadge type="HALF_DAY_AM" />
      <LeaveTypeBadge type="HALF_DAY_PM" />
      <LeaveTypeBadge type="MATERNITY" />
      <LeaveTypeBadge type="PATERNITY" />
      <LeaveTypeBadge type="UNPAID" />
    </div>
  ),
};
