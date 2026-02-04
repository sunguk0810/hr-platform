import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  ApprovalStatusBadge,
  EmploymentStatusBadge,
  LeaveStatusBadge,
  AttendanceStatusBadge,
  TenantStatusBadge,
  LeaveTypeBadge,
} from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render with label', () => {
    render(<StatusBadge status="success" label="성공" />);
    expect(screen.getByText('성공')).toBeInTheDocument();
  });

  it('should apply success styles', () => {
    render(<StatusBadge status="success" label="Success" />);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should apply warning styles', () => {
    render(<StatusBadge status="warning" label="Warning" />);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('should apply error styles', () => {
    render(<StatusBadge status="error" label="Error" />);
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should apply info styles', () => {
    render(<StatusBadge status="info" label="Info" />);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should apply pending styles', () => {
    render(<StatusBadge status="pending" label="Pending" />);
    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
  });

  it('should apply default styles', () => {
    render(<StatusBadge status="default" label="Default" />);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should render with dot indicator', () => {
    render(<StatusBadge status="success" label="With Dot" dot />);
    const badge = screen.getByText('With Dot');
    const dotContainer = badge.querySelector('.relative.mr-1\\.5');
    expect(dotContainer).toBeInTheDocument();
  });

  it('should render with pulse animation when pulse and dot are true', () => {
    const { container } = render(<StatusBadge status="success" label="Pulsing" dot pulse />);
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).toBeInTheDocument();
  });

  it('should not render pulse without dot', () => {
    const { container } = render(<StatusBadge status="success" label="No Pulse" pulse />);
    const animatedDot = container.querySelector('.animate-ping');
    expect(animatedDot).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<StatusBadge status="success" label="Custom" className="custom-class" />);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have correct dot color for each status', () => {
    const { container } = render(<StatusBadge status="error" label="Error Dot" dot />);
    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
  });
});

describe('ApprovalStatusBadge', () => {
  it('should render DRAFT status', () => {
    render(<ApprovalStatusBadge status="DRAFT" />);
    expect(screen.getByText('임시저장')).toBeInTheDocument();
  });

  it('should render PENDING status', () => {
    render(<ApprovalStatusBadge status="PENDING" />);
    expect(screen.getByText('결재대기')).toBeInTheDocument();
  });

  it('should render APPROVED status', () => {
    render(<ApprovalStatusBadge status="APPROVED" />);
    expect(screen.getByText('승인')).toBeInTheDocument();
  });

  it('should render REJECTED status', () => {
    render(<ApprovalStatusBadge status="REJECTED" />);
    expect(screen.getByText('반려')).toBeInTheDocument();
  });

  it('should render CANCELED status', () => {
    render(<ApprovalStatusBadge status="CANCELED" />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('should render CANCELLED status', () => {
    render(<ApprovalStatusBadge status="CANCELLED" />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });
});

describe('EmploymentStatusBadge', () => {
  it('should render ACTIVE status', () => {
    render(<EmploymentStatusBadge status="ACTIVE" />);
    expect(screen.getByText('재직')).toBeInTheDocument();
  });

  it('should render ON_LEAVE status', () => {
    render(<EmploymentStatusBadge status="ON_LEAVE" />);
    expect(screen.getByText('휴직')).toBeInTheDocument();
  });

  it('should render RESIGNED status', () => {
    render(<EmploymentStatusBadge status="RESIGNED" />);
    expect(screen.getByText('퇴직')).toBeInTheDocument();
  });

  it('should render RETIRED status', () => {
    render(<EmploymentStatusBadge status="RETIRED" />);
    expect(screen.getByText('정년퇴직')).toBeInTheDocument();
  });

  it('should render SUSPENDED status', () => {
    render(<EmploymentStatusBadge status="SUSPENDED" />);
    expect(screen.getByText('정직')).toBeInTheDocument();
  });
});

describe('LeaveStatusBadge', () => {
  it('should render PENDING status', () => {
    render(<LeaveStatusBadge status="PENDING" />);
    expect(screen.getByText('승인대기')).toBeInTheDocument();
  });

  it('should render APPROVED status', () => {
    render(<LeaveStatusBadge status="APPROVED" />);
    expect(screen.getByText('승인')).toBeInTheDocument();
  });

  it('should render REJECTED status', () => {
    render(<LeaveStatusBadge status="REJECTED" />);
    expect(screen.getByText('반려')).toBeInTheDocument();
  });

  it('should render CANCELLED status', () => {
    render(<LeaveStatusBadge status="CANCELLED" />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });
});

describe('AttendanceStatusBadge', () => {
  it('should render NORMAL status', () => {
    render(<AttendanceStatusBadge status="NORMAL" />);
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('should render LATE status', () => {
    render(<AttendanceStatusBadge status="LATE" />);
    expect(screen.getByText('지각')).toBeInTheDocument();
  });

  it('should render EARLY_LEAVE status', () => {
    render(<AttendanceStatusBadge status="EARLY_LEAVE" />);
    expect(screen.getByText('조퇴')).toBeInTheDocument();
  });

  it('should render ABSENT status', () => {
    render(<AttendanceStatusBadge status="ABSENT" />);
    expect(screen.getByText('결근')).toBeInTheDocument();
  });

  it('should render HOLIDAY status', () => {
    render(<AttendanceStatusBadge status="HOLIDAY" />);
    expect(screen.getByText('휴일')).toBeInTheDocument();
  });

  it('should render WEEKEND status', () => {
    render(<AttendanceStatusBadge status="WEEKEND" />);
    expect(screen.getByText('주말')).toBeInTheDocument();
  });

  it('should render LEAVE status', () => {
    render(<AttendanceStatusBadge status="LEAVE" />);
    expect(screen.getByText('휴가')).toBeInTheDocument();
  });

  it('should render OVERTIME status', () => {
    render(<AttendanceStatusBadge status="OVERTIME" />);
    expect(screen.getByText('초과근무')).toBeInTheDocument();
  });
});

describe('TenantStatusBadge', () => {
  it('should render ACTIVE status', () => {
    render(<TenantStatusBadge status="ACTIVE" />);
    expect(screen.getByText('활성')).toBeInTheDocument();
  });

  it('should render INACTIVE status', () => {
    render(<TenantStatusBadge status="INACTIVE" />);
    expect(screen.getByText('비활성')).toBeInTheDocument();
  });

  it('should render SUSPENDED status', () => {
    render(<TenantStatusBadge status="SUSPENDED" />);
    expect(screen.getByText('정지')).toBeInTheDocument();
  });

  it('should render PENDING status', () => {
    render(<TenantStatusBadge status="PENDING" />);
    expect(screen.getByText('대기')).toBeInTheDocument();
  });
});

describe('LeaveTypeBadge', () => {
  it('should render ANNUAL type', () => {
    render(<LeaveTypeBadge type="ANNUAL" />);
    expect(screen.getByText('연차')).toBeInTheDocument();
  });

  it('should render SICK type', () => {
    render(<LeaveTypeBadge type="SICK" />);
    expect(screen.getByText('병가')).toBeInTheDocument();
  });

  it('should render SPECIAL type', () => {
    render(<LeaveTypeBadge type="SPECIAL" />);
    expect(screen.getByText('특별휴가')).toBeInTheDocument();
  });

  it('should render HALF_DAY_AM type', () => {
    render(<LeaveTypeBadge type="HALF_DAY_AM" />);
    expect(screen.getByText('반차(오전)')).toBeInTheDocument();
  });

  it('should render HALF_DAY_PM type', () => {
    render(<LeaveTypeBadge type="HALF_DAY_PM" />);
    expect(screen.getByText('반차(오후)')).toBeInTheDocument();
  });

  it('should render MATERNITY type', () => {
    render(<LeaveTypeBadge type="MATERNITY" />);
    expect(screen.getByText('출산휴가')).toBeInTheDocument();
  });

  it('should render PATERNITY type', () => {
    render(<LeaveTypeBadge type="PATERNITY" />);
    expect(screen.getByText('배우자출산휴가')).toBeInTheDocument();
  });

  it('should render UNPAID type', () => {
    render(<LeaveTypeBadge type="UNPAID" />);
    expect(screen.getByText('무급휴가')).toBeInTheDocument();
  });
});
