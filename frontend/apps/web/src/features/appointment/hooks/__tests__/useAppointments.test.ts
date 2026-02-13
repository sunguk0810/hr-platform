import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointmentSearchParams } from '../useAppointments';

describe('useAppointmentSearchParams', () => {
  it('should build query params with status and date range only', () => {
    const { result } = renderHook(() => useAppointmentSearchParams(20));

    expect(result.current.params).toEqual({
      page: 0,
      size: 20,
    });

    act(() => {
      result.current.setStatus('PENDING_APPROVAL');
      result.current.setDateRange('2026-02-01', '2026-02-29');
    });

    expect(result.current.params).toEqual({
      page: 0,
      size: 20,
      status: 'PENDING_APPROVAL',
      startDate: '2026-02-01',
      endDate: '2026-02-29',
    });
  });

  it('should keep keyword in UI state but exclude from request params', () => {
    const { result } = renderHook(() => useAppointmentSearchParams(10));

    act(() => {
      result.current.setKeyword('홍길동');
      result.current.setStatus('');
    });

    expect(result.current.searchState.keyword).toBe('홍길동');
    expect(result.current.params).toEqual({
      page: 0,
      size: 10,
    });
  });
});
