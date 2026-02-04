import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    page: 0,
    totalPages: 5,
    onPageChange: vi.fn(),
  };

  it('should render pagination info', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText('페이지 1 / 5')).toBeInTheDocument();
  });

  it('should show correct page number (1-indexed display)', () => {
    render(<Pagination {...defaultProps} page={2} />);
    expect(screen.getByText('페이지 3 / 5')).toBeInTheDocument();
  });

  it('should render previous and next buttons', () => {
    render(<Pagination {...defaultProps} page={2} />);
    expect(screen.getByRole('button', { name: /이전/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다음/i })).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    render(<Pagination {...defaultProps} page={0} />);
    expect(screen.getByRole('button', { name: /이전/i })).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination {...defaultProps} page={4} />);
    expect(screen.getByRole('button', { name: /다음/i })).toBeDisabled();
  });

  it('should enable both buttons on middle page', () => {
    render(<Pagination {...defaultProps} page={2} />);
    expect(screen.getByRole('button', { name: /이전/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /다음/i })).not.toBeDisabled();
  });

  it('should call onPageChange with previous page when previous button is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} page={2} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /이전/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange with next page when next button is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} page={2} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /다음/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should not render when totalPages is 0', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render when totalPages is 1', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when totalPages is greater than 1', () => {
    render(<Pagination {...defaultProps} totalPages={2} />);
    expect(screen.getByText('페이지 1 / 2')).toBeInTheDocument();
  });

  it('should handle edge case when page equals totalPages - 1', () => {
    render(<Pagination {...defaultProps} page={4} totalPages={5} />);
    expect(screen.getByText('페이지 5 / 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다음/i })).toBeDisabled();
  });

  it('should render chevron icons in buttons', () => {
    const { container } = render(<Pagination {...defaultProps} page={2} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });
});
