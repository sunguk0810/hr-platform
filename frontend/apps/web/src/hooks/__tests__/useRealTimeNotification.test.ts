import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAttendanceRealTime } from '../useRealTimeNotification';
import { wsClient } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '../useToast';
import { useQueryClient } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/lib/websocket', () => ({
  wsClient: {
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
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
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
        if (options?.time) return `${key} ${options.time}`;
        return key;
    },
  }),
}));

// Mock queryKeys
vi.mock('@/lib/queryClient', () => ({
  queryKeys: {
    dashboard: {
      attendance: () => ['dashboard', 'attendance'],
    },
    attendance: {
      all: ['attendance'],
      today: () => ['attendance', 'today'],
      list: () => ['attendance', 'list'],
      monthly: () => ['attendance', 'monthly'],
      summary: () => ['attendance', 'summary'],
    },
  },
}));

describe('useAttendanceRealTime', () => {
  const mockToast = vi.fn();
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (wsClient.on as any).mockReturnValue(() => {});
  });

  it('should not subscribe if not authenticated', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });
    renderHook(() => useAttendanceRealTime());
    expect(wsClient.on).not.toHaveBeenCalled();
  });

  it('should subscribe to check-in and check-out events if authenticated', () => {
    renderHook(() => useAttendanceRealTime());
    expect(wsClient.on).toHaveBeenCalledWith('attendance:checked_in', expect.any(Function));
    expect(wsClient.on).toHaveBeenCalledWith('attendance:checked_out', expect.any(Function));
  });

  it('should handle check-in event', () => {
    let checkInHandler: (event: any) => void = () => {};
    (wsClient.on as any).mockImplementation((event: string, handler: any) => {
      if (event === 'attendance:checked_in') {
        checkInHandler = handler;
      }
      return () => {};
    });

    renderHook(() => useAttendanceRealTime());

    const event = { time: '09:00:00' };
    checkInHandler(event);

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2); // dashboard and all
    expect(mockToast).toHaveBeenCalledWith({
      title: 'realTime.checkIn',
      description: 'realTime.checkInDesc 09:00:00',
    });
  });

  it('should handle check-out event', () => {
    let checkOutHandler: (event: any) => void = () => {};
    (wsClient.on as any).mockImplementation((event: string, handler: any) => {
      if (event === 'attendance:checked_out') {
        checkOutHandler = handler;
      }
      return () => {};
    });

    renderHook(() => useAttendanceRealTime());

    const event = { time: '18:00:00' };
    checkOutHandler(event);

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'realTime.checkOut',
      description: 'realTime.checkOutDesc 18:00:00',
    });
  });
});
