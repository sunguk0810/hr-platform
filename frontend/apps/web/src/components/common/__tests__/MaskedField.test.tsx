import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaskedField } from '../MaskedField';

describe('MaskedField', () => {
  describe('masking types', () => {
    it('should mask phone numbers', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle={false} />);
      expect(screen.getByText('010-****-5678')).toBeInTheDocument();
    });

    it('should mask emails', () => {
      render(<MaskedField value="user@example.com" type="email" showToggle={false} />);
      expect(screen.getByText('u***@example.com')).toBeInTheDocument();
    });

    it('should mask Korean names (3 characters)', () => {
      render(<MaskedField value="홍길동" type="name" showToggle={false} />);
      expect(screen.getByText('홍*동')).toBeInTheDocument();
    });

    it('should mask Korean names (2 characters)', () => {
      render(<MaskedField value="홍길" type="name" showToggle={false} />);
      expect(screen.getByText('홍*')).toBeInTheDocument();
    });

    it('should mask Korean names (1 character)', () => {
      render(<MaskedField value="홍" type="name" showToggle={false} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should mask resident numbers (ssn)', () => {
      render(<MaskedField value="901231-1234567" type="ssn" showToggle={false} />);
      expect(screen.getByText('901231-*******')).toBeInTheDocument();
    });

    it('should mask resident numbers (residentNumber)', () => {
      render(<MaskedField value="901231-1234567" type="residentNumber" showToggle={false} />);
      expect(screen.getByText('901231-*******')).toBeInTheDocument();
    });

    it('should mask bank accounts', () => {
      render(<MaskedField value="123-456-789012" type="bankAccount" showToggle={false} />);
      expect(screen.getByText('***-***-789012')).toBeInTheDocument();
    });

    it('should mask card numbers with dashes', () => {
      render(<MaskedField value="1234-5678-9012-3456" type="cardNumber" showToggle={false} />);
      expect(screen.getByText('****-****-****-3456')).toBeInTheDocument();
    });

    it('should mask card numbers without dashes', () => {
      render(<MaskedField value="1234567890123456" type="cardNumber" showToggle={false} />);
      expect(screen.getByText('************3456')).toBeInTheDocument();
    });

    it('should use custom mask function', () => {
      const customMask = (value: string) => value.replace(/./g, 'X');
      render(
        <MaskedField value="secret" type="custom" customMask={customMask} showToggle={false} />
      );
      expect(screen.getByText('XXXXXX')).toBeInTheDocument();
    });
  });

  describe('empty and edge cases', () => {
    it('should show dash for empty value', () => {
      render(<MaskedField value="" type="phone" showToggle={false} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle short phone numbers', () => {
      render(<MaskedField value="010-123" type="phone" showToggle={false} />);
      // Short numbers should be fully masked
      expect(screen.getByText('*******')).toBeInTheDocument();
    });

    it('should handle emails without @ symbol', () => {
      render(<MaskedField value="invalid" type="email" showToggle={false} />);
      expect(screen.getByText('***')).toBeInTheDocument();
    });

    it('should handle short resident numbers', () => {
      render(<MaskedField value="901231" type="residentNumber" showToggle={false} />);
      expect(screen.getByText('******')).toBeInTheDocument();
    });
  });

  describe('deprecated maskType prop', () => {
    it('should support legacy maskType prop', () => {
      render(<MaskedField value="010-1234-5678" maskType="phone" showToggle={false} />);
      expect(screen.getByText('010-****-5678')).toBeInTheDocument();
    });

    it('should prioritize type over maskType', () => {
      render(
        <MaskedField value="test@example.com" type="email" maskType="phone" showToggle={false} />
      );
      expect(screen.getByText('t***@example.com')).toBeInTheDocument();
    });
  });

  describe('toggle functionality', () => {
    it('should not show toggle button when showToggle is false', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not show toggle button when canReveal is false', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle canReveal={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should show toggle button when showToggle and canReveal are true', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle canReveal />);
      expect(screen.getByRole('button', { name: '보기' })).toBeInTheDocument();
    });

    it('should reveal value when toggle is clicked', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle canReveal />);

      expect(screen.getByText('010-****-5678')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '보기' }));

      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '숨기기' })).toBeInTheDocument();
    });

    it('should hide value when toggle is clicked again', () => {
      render(<MaskedField value="010-1234-5678" type="phone" showToggle canReveal />);

      fireEvent.click(screen.getByRole('button', { name: '보기' }));
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '숨기기' }));
      expect(screen.getByText('010-****-5678')).toBeInTheDocument();
    });
  });

  describe('onRevealRequest', () => {
    it('should call onRevealRequest when revealing with async function', async () => {
      const onRevealRequest = vi.fn().mockResolvedValue('revealed-value');

      render(
        <MaskedField
          value="010-1234-5678"
          type="phone"
          showToggle
          canReveal
          onRevealRequest={onRevealRequest}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '보기' }));

      expect(onRevealRequest).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText('revealed-value')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching revealed value', async () => {
      const onRevealRequest = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('revealed'), 100))
      );

      render(
        <MaskedField
          value="010-1234-5678"
          type="phone"
          showToggle
          canReveal
          onRevealRequest={onRevealRequest}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '보기' }));

      // Button should be disabled during loading
      expect(screen.getByRole('button')).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('revealed')).toBeInTheDocument();
      });
    });

    it('should handle onRevealRequest error gracefully', async () => {
      const onRevealRequest = vi.fn().mockRejectedValue(new Error('Failed'));

      render(
        <MaskedField
          value="010-1234-5678"
          type="phone"
          showToggle
          canReveal
          onRevealRequest={onRevealRequest}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: '보기' }));

      await waitFor(() => {
        // Should still show masked value after error
        expect(screen.getByText('010-****-5678')).toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MaskedField value="test" type="custom" showToggle={false} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply font-mono class to masked text', () => {
      const { container } = render(
        <MaskedField value="test" type="custom" showToggle={false} />
      );
      expect(container.querySelector('.font-mono')).toBeInTheDocument();
    });
  });
});
