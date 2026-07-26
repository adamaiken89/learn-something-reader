import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';

import { useClipboardFallback } from './useClipboardFallback';

function fireKeydown(params: { key: string; ctrl?: boolean; meta?: boolean }) {
  return new window.KeyboardEvent('keydown', {
    key: params.key,
    ctrlKey: params.ctrl ?? false,
    metaKey: params.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
}

describe('useClipboardFallback', () => {
  test('mounts and unmounts without error', () => {
    const { unmount } = renderHook(() => useClipboardFallback());
    unmount();
  });

  test('ignores non-input focus', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    await act(async () => {
      renderHook(() => useClipboardFallback());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event);
    });

    document.body.removeChild(btn);
  });

  test('ignores non-modifier key', async () => {
    const input = document.createElement('input');
    input.value = 'hello';
    document.body.appendChild(input);
    input.focus();
    input.selectionStart = 2;
    input.selectionEnd = 2;

    await act(async () => {
      renderHook(() => useClipboardFallback());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a' });
      window.dispatchEvent(event);
    });

    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);

    document.body.removeChild(input);
  });
});
