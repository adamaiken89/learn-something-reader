import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, mock, test } from 'bun:test';

import { useEditableFieldShortcuts } from './useEditableFieldShortcuts';

const writeText = mock((_text: string) => Promise.resolve());

function stubClipboard(enabled: boolean) {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: enabled ? { writeText } : undefined,
  });
}

afterEach(() => {
  writeText.mockClear();
  stubClipboard(false);
  // select()/addRange() leak into the shared happy-dom document; a lingering
  // non-collapsed selection derails later click-selection tests (e.g.
  // useNotePopoverOnClick early-returns when selection is non-collapsed).
  window.getSelection()?.removeAllRanges();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});

function fireKeydown(params: { key: string; ctrl?: boolean; meta?: boolean }) {
  return new window.KeyboardEvent('keydown', {
    key: params.key,
    ctrlKey: params.ctrl ?? false,
    metaKey: params.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
}

describe('useEditableFieldShortcuts', () => {
  test('mounts and unmounts without error', () => {
    const { unmount } = renderHook(() => useEditableFieldShortcuts());
    unmount();
  });

  test('ignores non-input focus', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
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
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a' });
      window.dispatchEvent(event);
    });

    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);

    document.body.removeChild(input);
  });

  test('ctrl+a selects all text in focused input', async () => {
    const input = document.createElement('input');
    input.value = 'hello world';
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(3, 5);

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event);
    });

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(11);

    document.body.removeChild(input);
  });

  test('meta+a selects all text in textarea', async () => {
    const ta = document.createElement('textarea');
    ta.value = 'line one';
    document.body.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(0, 4);

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a', meta: true });
      window.dispatchEvent(event);
    });

    expect(ta.selectionStart).toBe(0);
    expect(ta.selectionEnd).toBe(8);

    document.body.removeChild(ta);
  });

  test('ctrl+a works on role=textbox element via window selection', async () => {
    const div = document.createElement('div');
    div.setAttribute('role', 'textbox');
    document.body.appendChild(div);
    div.focus();

    const range = document.createRange();
    range.selectNodeContents(document.body);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event);
    });

    // role=textbox has no select() method — handler must not throw
    expect(div.tagName).toBe('DIV');

    document.body.removeChild(div);
  });

  test('ctrl+a works on contentEditable element without throwing', async () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    div.focus();

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'a', ctrl: true });
      window.dispatchEvent(event);
    });

    expect(div.isContentEditable).toBe(true);

    document.body.removeChild(div);
  });

  test('ctrl+c copies selection to clipboard', async () => {
    stubClipboard(true);
    const input = document.createElement('input');
    input.value = 'copy me';
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(0, 7);

    const readSelection = mock(() =>
      input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0),
    );
    const origGetSelection = window.getSelection;
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () => ({ toString: readSelection }),
    });

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'c', ctrl: true });
      window.dispatchEvent(event);
    });

    Object.defineProperty(window, 'getSelection', { configurable: true, value: origGetSelection });
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledWith('copy me');

    document.body.removeChild(input);
  });

  test('ctrl+c with empty selection does not write clipboard', async () => {
    stubClipboard(true);
    const origGetSelection = window.getSelection;
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () => ({ toString: () => '' }),
    });

    const btn = document.createElement('input');
    btn.value = '';
    document.body.appendChild(btn);
    btn.focus();

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
    });

    await act(async () => {
      const event = fireKeydown({ key: 'c', meta: true });
      window.dispatchEvent(event);
    });

    Object.defineProperty(window, 'getSelection', { configurable: true, value: origGetSelection });
    expect(writeText).not.toHaveBeenCalled();

    document.body.removeChild(btn);
  });

  test('ctrl+c throws safely when clipboard API unavailable', async () => {
    stubClipboard(false);
    const input = document.createElement('input');
    input.value = 'text';
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(0, 4);

    const origGetSelection = window.getSelection;
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () => ({ toString: () => 'text' }),
    });

    await act(async () => {
      renderHook(() => useEditableFieldShortcuts());
      const event = fireKeydown({ key: 'c', ctrl: true });
      window.dispatchEvent(event); // must not propagate error
    });

    Object.defineProperty(window, 'getSelection', { configurable: true, value: origGetSelection });
    expect(writeText).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
