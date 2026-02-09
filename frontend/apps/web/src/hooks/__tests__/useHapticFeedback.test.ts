import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHapticFeedback } from '../useHapticFeedback';

describe('useHapticFeedback', () => {
  it('should detect support', () => {
    const { result } = renderHook(() => useHapticFeedback());
    expect(typeof result.current.isSupported).toBe('boolean');
  });

  it('should trigger vibration with medium pattern', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.trigger('medium');
    });

    expect(vibrateSpy).toHaveBeenCalledWith(20);
  });

  it('should trigger vibration with light pattern', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.trigger('light');
    });

    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });

  it('should trigger vibration with heavy pattern', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.trigger('heavy');
    });

    expect(vibrateSpy).toHaveBeenCalledWith(30);
  });

  it('should default to medium when no style specified', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());
    act(() => {
      result.current.trigger();
    });

    expect(vibrateSpy).toHaveBeenCalledWith(20);
  });
});
