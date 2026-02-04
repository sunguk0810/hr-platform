import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    onConfirm: vi.fn(),
  };

  it('should render when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should render title', () => {
    render(<ConfirmDialog {...defaultProps} title="Delete Item?" />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        description="This action cannot be undone."
      />
    );
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('should use default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('should use custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="삭제하기"
        cancelLabel="돌아가기"
      />
    );
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument();
  });

  it('should support deprecated confirmText and cancelText props', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="예"
        cancelText="아니오"
      />
    );
    expect(screen.getByRole('button', { name: '예' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '아니오' })).toBeInTheDocument();
  });

  it('should prioritize new props over deprecated props', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="확인하기"
        confirmText="예"
        cancelLabel="취소하기"
        cancelText="아니오"
      />
    );
    expect(screen.getByRole('button', { name: '확인하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소하기' })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel and onOpenChange when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...defaultProps}
        onCancel={onCancel}
        onOpenChange={onOpenChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should only call onOpenChange when cancel clicked without onCancel', () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show loading state when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);
    expect(screen.getByRole('button', { name: '처리 중...' })).toBeInTheDocument();
  });

  it('should disable buttons when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);

    const confirmButton = screen.getByRole('button', { name: '처리 중...' });
    const cancelButton = screen.getByRole('button', { name: '취소' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should apply destructive variant to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);

    const confirmButton = screen.getByRole('button', { name: '확인' });
    // Check that destructive variant class is applied
    expect(confirmButton).toHaveClass('bg-destructive');
  });

  it('should apply default variant to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);

    const confirmButton = screen.getByRole('button', { name: '확인' });
    // Default variant should not have destructive class
    expect(confirmButton).not.toHaveClass('bg-destructive');
  });
});
