import { describe, it, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppointmentListPage from '../AppointmentListPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/common/StatusBadge', () => ({
  AppointmentDraftStatusBadge: () => <div>badge</div>,
}));

vi.mock('@/components/common/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/common/PageHeader', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

vi.mock('@/components/common/Pagination', () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock('@/components/common/Skeleton', () => ({
  SkeletonTable: () => <div data-testid="skeleton" />,
}));

vi.mock('../../hooks/useAppointments', () => ({
  useAppointmentDrafts: () => ({
    data: {
      data: {
        content: [
          {
            id: 'draft-1',
            draftNumber: 'D-001',
            title: '진급요청',
            effectiveDate: '2026-02-01',
            detailCount: 2,
            status: 'APPROVED',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
        page: {
          totalPages: 1,
        },
      },
    },
    isLoading: false,
  }),
  useAppointmentSummary: () => ({
    data: {
      data: {
        draftCount: 1,
        pendingApprovalCount: 0,
        approvedCount: 1,
        executedCount: 0,
      },
    },
    isLoading: false,
  }),
  useAppointmentSearchParams: () => ({
    params: {
      page: 0,
      size: 10,
    },
    searchState: {
      status: '',
      keyword: '',
      page: 0,
      size: 10,
    },
    setStatus: vi.fn(),
    setKeyword: vi.fn(),
    setPage: vi.fn(),
    resetFilters: vi.fn(),
    setDateRange: vi.fn(),
    setKeywordRange: vi.fn(),
  }),
}));

describe('AppointmentListPage', () => {
  it('renders without crash when drafter is missing and shows placeholder', () => {
    render(<AppointmentListPage />);

    expect(screen.getByText('D-001')).toBeInTheDocument();
    expect(screen.getByText('진급요청')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
