import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAttendanceRealTime } from '../useRealTimeNotification';
import { wsClient } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '../useToast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

// Mock dependencies
vi.mock('@/lib/websocket', () => ({
  wsClient: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../useToast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
  QueryClient: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('useAttendanceRealTime', () => {
  const mockToast = vi.fn();
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as any).mockReturnValue({ toast: mockToast });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    (wsClient.on as any).mockReturnValue(vi.fn()); // return unsubscribe function
  });

  it('should subscribe to attendance events when authenticated', () => {
    renderHook(() => useAttendanceRealTime());

    expect(wsClient.on).toHaveBeenCalledWith('attendance:checked_in', expect.any(Function));
    expect(wsClient.on).toHaveBeenCalledWith('attendance:checked_out', expect.any(Function));
  });

  it('should not subscribe when not authenticated', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });
    renderHook(() => useAttendanceRealTime());

    expect(wsClient.on).not.toHaveBeenCalled();
  });

  it('should invalidate queries and show toast on check-in', () => {
    renderHook(() => useAttendanceRealTime());

    // Get the callback passed to wsClient.on
    const checkInCall = (wsClient.on as any).mock.calls.find((call: any[]) => call[0] === 'attendance:checked_in');
    const checkInCallback = checkInCall[1];

    // Simulate event
    checkInCallback({});

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.attendance.all });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.attendance() });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'realTime.checkIn',
      description: 'realTime.checkInDesc',
    });
  });

  it('should invalidate queries and show toast on check-out', () => {
    renderHook(() => useAttendanceRealTime());

    // Get the callback passed to wsClient.on
    const checkOutCall = (wsClient.on as any).mock.calls.find((call: any[]) => call[0] === 'attendance:checked_out');
    const checkOutCallback = checkOutCall[1];

    // Simulate event
    checkOutCallback({});

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.attendance.all });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.attendance() });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'realTime.checkOut',
      description: 'realTime.checkOutDesc',
    });
  });
});
