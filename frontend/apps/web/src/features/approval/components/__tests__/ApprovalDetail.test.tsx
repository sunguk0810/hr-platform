import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ApprovalDetail } from '../ApprovalDetail';
import type { Approval } from '@hr-platform/shared-types';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock UI components to simplify
vi.mock('@/components/common/StatusBadge', () => ({
  ApprovalStatusBadge: ({ status }: any) => <div>Status: {status}</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardTitle: ({ children }: any) => <h1>{children}</h1>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('lucide-react', () => ({
  FileText: () => <span>FileText</span>,
  User: () => <span>User</span>,
  Building2: () => <span>Building2</span>,
  Calendar: () => <span>Calendar</span>,
  Check: () => <span>Check</span>,
  X: () => <span>X</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Paperclip: () => <span>Paperclip</span>,
  Loader2: () => <span>Loader2</span>,
}));

describe('ApprovalDetail', () => {
  const mockApproval: Approval = {
    id: '1',
    documentNumber: 'DOC-001',
    documentType: 'LEAVE_REQUEST',
    title: 'Test Approval',
    content: '<p>Safe Content</p><script>alert("XSS")</script>',
    drafterId: 'user1',
    drafterName: 'John Doe',
    drafterDepartmentName: 'IT',
    status: 'PENDING',
    approvalLines: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: 'tenant1',
  };

  it('sanitizes malicious content', () => {
    render(<ApprovalDetail approval={mockApproval} />);

    // Check for safe content
    expect(screen.getByText('Safe Content')).toBeInTheDocument();

    // Check that script tag is removed from the DOM
    // Note: React testing library creates a container, but 'document.querySelector' looks at the whole jsdom document.
    // 'screen' queries within the rendered component.
    // But dangerouslySetInnerHTML creates actual HTML nodes.

    const proseContainer = document.querySelector('.prose');
    expect(proseContainer).toBeInTheDocument();
    expect(proseContainer?.innerHTML).not.toContain('<script>');
    // It should contain the sanitized content
    expect(proseContainer?.innerHTML).toContain('<p>Safe Content</p>');
  });
});
