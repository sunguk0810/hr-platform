import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    // Reset state between tests by dismissing all toasts
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it('should return toast function and toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeDefined();
    expect(result.current.toasts).toBeDefined();
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test',
      });
    });

    expect(result.current.toasts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].description).toBe('This is a test');
  });

  it('should dismiss a specific toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const { id } = result.current.toast({ title: 'Toast to dismiss' });
      toastId = id;
    });

    expect(result.current.toasts.some(t => t.id === toastId)).toBe(true);

    act(() => {
      result.current.dismiss(toastId);
    });

    const dismissedToast = result.current.toasts.find(t => t.id === toastId);
    expect(dismissedToast?.open).toBe(false);
  });

  it('should dismiss all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    act(() => {
      result.current.dismiss();
    });

    result.current.toasts.forEach(t => {
      expect(t.open).toBe(false);
    });
  });

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast());

    let toastInstance: ReturnType<typeof result.current.toast>;
    act(() => {
      toastInstance = result.current.toast({ title: 'Original Title' });
    });

    act(() => {
      toastInstance.update({ title: 'Updated Title' });
    });

    const updatedToast = result.current.toasts.find(t => t.id === toastInstance.id);
    expect(updatedToast?.title).toBe('Updated Title');
  });

  it('should auto-dismiss toast on onOpenChange(false)', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test' });
    });

    const toastItem = result.current.toasts[0];

    act(() => {
      toastItem.onOpenChange?.(false);
    });

    const dismissedToast = result.current.toasts.find(t => t.id === toastItem.id);
    expect(dismissedToast?.open).toBe(false);
  });
});

describe('toast function', () => {
  it('should return id, dismiss, and update functions', () => {
    let result: ReturnType<typeof toast>;

    act(() => {
      result = toast({ title: 'Test' });
    });

    expect(result!.id).toBeDefined();
    expect(typeof result!.dismiss).toBe('function');
    expect(typeof result!.update).toBe('function');
  });
});

describe('reducer', () => {
  const initialState = { toasts: [] };

  it('should add toast on ADD_TOAST action', () => {
    const mockToast = {
      id: '1',
      title: 'Test',
      open: true,
    };

    const newState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast: mockToast,
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0]).toEqual(mockToast);
  });

  it('should update toast on UPDATE_TOAST action', () => {
    const state = {
      toasts: [{ id: '1', title: 'Original', open: true }],
    };

    const newState = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    });

    expect(newState.toasts[0].title).toBe('Updated');
    expect(newState.toasts[0].open).toBe(true);
  });

  it('should set open to false on DISMISS_TOAST action', () => {
    const state = {
      toasts: [{ id: '1', title: 'Test', open: true }],
    };

    const newState = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: '1',
    });

    expect(newState.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts when no toastId provided', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Test 1', open: true },
        { id: '2', title: 'Test 2', open: true },
      ],
    };

    const newState = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: undefined,
    });

    newState.toasts.forEach(t => {
      expect(t.open).toBe(false);
    });
  });

  it('should remove toast on REMOVE_TOAST action', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Test 1', open: true },
        { id: '2', title: 'Test 2', open: true },
      ],
    };

    const newState = reducer(state, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should remove all toasts when no toastId provided on REMOVE_TOAST', () => {
    const state = {
      toasts: [
        { id: '1', title: 'Test 1', open: true },
        { id: '2', title: 'Test 2', open: true },
      ],
    };

    const newState = reducer(state, {
      type: 'REMOVE_TOAST',
      toastId: undefined,
    });

    expect(newState.toasts).toHaveLength(0);
  });

  it('should limit toasts to TOAST_LIMIT', () => {
    // TOAST_LIMIT is 1 based on the source code
    const state = {
      toasts: [{ id: '1', title: 'Existing', open: true }],
    };

    const newState = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'New', open: true },
    });

    // New toast is added first, then sliced to limit
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });
});
