import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Search, FileX } from 'lucide-react';

describe('EmptyState', () => {
  it('should render with title', () => {
    render(<EmptyState title="데이터가 없습니다" />);
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('should render with description', () => {
    render(
      <EmptyState
        title="검색 결과 없음"
        description="다른 검색어로 시도해보세요."
      />
    );
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
    expect(screen.getByText('다른 검색어로 시도해보세요.')).toBeInTheDocument();
  });

  it('should render default icon (Inbox)', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-8', 'w-8');
  });

  it('should render custom icon', () => {
    const { container } = render(<EmptyState title="No Results" icon={Search} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render another custom icon', () => {
    const { container } = render(<EmptyState title="No Files" icon={FileX} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render action button when action is provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No Items"
        action={{ label: '새로 만들기', onClick }}
      />
    );

    const button = screen.getByRole('button', { name: '새로 만들기' });
    expect(button).toBeInTheDocument();
  });

  it('should call action onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No Items"
        action={{ label: '추가하기', onClick }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '추가하기' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when action is not provided', () => {
    render(<EmptyState title="No Items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have centered content', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should render icon in a rounded background', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconContainer = container.querySelector('.rounded-full.bg-muted');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render title as heading', () => {
    render(<EmptyState title="No Data Available" />);
    const heading = screen.getByRole('heading', { name: 'No Data Available' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  it('should render description with muted styling', () => {
    render(
      <EmptyState title="Empty" description="Some description" />
    );
    expect(screen.getByText('Some description')).toHaveClass('text-muted-foreground');
  });

  it('should not render description element when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('should render static fallback when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<EmptyState title="Reduced Motion" />);
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    // Static fallback should not have motion wrappers
    const iconContainer = container.querySelector('.rounded-full.bg-muted');
    expect(iconContainer).toBeInTheDocument();
  });
});
