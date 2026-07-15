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

  test('handles Ctrl+A on input — selects all', async () => {
    const input = document.createElement('input');
    input.value = 'hello world';
    document.body.appendChild(input);
    input.focus();

    await act(async () => {
      renderHook(() => useClipboardFallback());
    });

    let event: KeyboardEvent;
    await act(async () => {
      event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event!);
    });

    expect(event!.defaultPrevented).toBe(true);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(11);

    document.body.removeChild(input);
  });

  test('ignores non-input focus', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    await act(async () => {
      renderHook(() => useClipboardFallback());
    });

    let event: KeyboardEvent;
    await act(async () => {
      event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event!);
    });

    expect(event!.defaultPrevented).toBe(false);

    document.body.removeChild(btn);
  });

  test('ignores non-modifier key', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await act(async () => {
      renderHook(() => useClipboardFallback());
    });

    let event: KeyboardEvent;
    await act(async () => {
      event = fireKeydown({ key: 'a' });
      window.dispatchEvent(event!);
    });

    expect(event!.defaultPrevented).toBe(false);

    document.body.removeChild(input);
  });
});
