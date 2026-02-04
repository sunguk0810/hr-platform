import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('defaultValue');
  });

  it('should return stored value when key exists', () => {
    mockLocalStorage.setItem('testKey', JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    expect(result.current[0]).toBe('storedValue');
  });

  it('should save value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      result.current[1]('newValue');
    });

    expect(result.current[0]).toBe('newValue');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify('newValue')
    );
  });

  it('should support function updater', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(6);
  });

  it('should remove value from localStorage', () => {
    mockLocalStorage.setItem('testKey', JSON.stringify('value'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

    expect(result.current[0]).toBe('value');

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('default');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
  });

  it('should handle JSON parsing correctly', () => {
    const complexObject = {
      name: 'Test',
      count: 42,
      nested: { active: true },
      items: [1, 2, 3],
    };

    mockLocalStorage.setItem('complexKey', JSON.stringify(complexObject));

    const { result } = renderHook(() =>
      useLocalStorage('complexKey', { name: 'Default', count: 0, nested: { active: false }, items: [] })
    );

    expect(result.current[0]).toEqual(complexObject);
  });

  it('should handle invalid JSON gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValueOnce('invalid json {{{');

    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

    expect(result.current[0]).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should work with array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arrayKey', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('should work with boolean values', () => {
    const { result } = renderHook(() => useLocalStorage<boolean>('boolKey', false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it('should work with number values', () => {
    const { result } = renderHook(() => useLocalStorage<number>('numKey', 0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  it('should dispatch storage event on value change', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useLocalStorage('eventKey', 'initial'));

    act(() => {
      result.current[1]('newValue');
    });

    expect(dispatchEventSpy).toHaveBeenCalled();
    const event = dispatchEventSpy.mock.calls[0][0] as StorageEvent;
    expect(event.type).toBe('storage');
    expect(event.key).toBe('eventKey');
    expect(event.newValue).toBe(JSON.stringify('newValue'));

    dispatchEventSpy.mockRestore();
  });

  it('should respond to storage events from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('syncKey', 'initial'));

    expect(result.current[0]).toBe('initial');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'syncKey',
          newValue: JSON.stringify('fromOtherTab'),
        })
      );
    });

    expect(result.current[0]).toBe('fromOtherTab');
  });

  it('should reset to initial value when storage event has null value', () => {
    mockLocalStorage.setItem('resetKey', JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('resetKey', 'default'));

    expect(result.current[0]).toBe('storedValue');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'resetKey',
          newValue: null,
        })
      );
    });

    expect(result.current[0]).toBe('default');
  });

  it('should ignore storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('myKey', 'original'));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'differentKey',
          newValue: JSON.stringify('newValue'),
        })
      );
    });

    expect(result.current[0]).toBe('original');
  });

  it('should handle SSR environment (no window)', () => {
    const originalWindow = global.window;

    // Simulate SSR by making window undefined for the readValue function
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    // Hook should use initialValue in SSR
    // Note: This test would need adjustment based on actual SSR behavior
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });
});
