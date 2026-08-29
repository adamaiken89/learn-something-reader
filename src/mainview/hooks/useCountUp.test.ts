import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';

import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  test('returns 0 for target 0', () => {
    const { result } = renderHook(() => useCountUp(0));
    expect(result.current).toBe(0);
  });

  test('starts at 0 for positive target', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    expect(result.current).toBe(0);
  });

  test('handles changing target to 0 mid-flight', async () => {
    const { result, rerender } = renderHook(({ t }) => useCountUp(t, 100), {
      initialProps: { t: 50 },
    });
    expect(result.current).toBe(0);
    rerender({ t: 0 });
    expect(result.current).toBe(0);
  });

  test('reaches target after enough wall-clock time', async () => {
    const { result } = renderHook(() => useCountUp(10, 30));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(result.current).toBe(10);
  });

  test('cleanup does not throw', () => {
    const { unmount } = renderHook(() => useCountUp(50, 100));
    expect(() => unmount()).not.toThrow();
  });
});
