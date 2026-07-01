import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { useLessonViewStore } from '../stores/lessonViewStore';
import { useLessonKeyboardShortcuts } from './useLessonKeyboardShortcuts';

let capturedListener: ((e: Partial<KeyboardEvent>) => void) | null = null;
let origAddEventListener: typeof window.addEventListener;

beforeEach(() => {
  useLessonViewStore.setState({ searchTrigger: 0 });
  capturedListener = null;
  origAddEventListener = window.addEventListener;
  window.addEventListener = mock((type: string, listener: EventListener) => {
    if (type === 'keydown') {
      capturedListener = listener as unknown as (e: Partial<KeyboardEvent>) => void;
    }
  }) as unknown as typeof window.addEventListener;
});

afterEach(() => {
  window.addEventListener = origAddEventListener;
});

function fireKey(key: string, opts?: { metaKey?: boolean; ctrlKey?: boolean }) {
  capturedListener?.({
    key,
    metaKey: opts?.metaKey ?? false,
    ctrlKey: opts?.ctrlKey ?? false,
    target: document.body,
    preventDefault: mock(() => {}),
  });
}

function setup(overrides: Partial<Parameters<typeof useLessonKeyboardShortcuts>[0]> = {}) {
  const params = {
    hasPrev: false,
    hasNext: false,
    goPrev: mock(() => {}),
    goNext: mock(() => {}),
    contentRef: { current: null },
    showToolbar: false,
    toggleSections: mock(() => {}),
    setSearchCourseOpen: mock(() => {}),
    ...overrides,
  };
  const result = renderHook(() => useLessonKeyboardShortcuts(params));
  return { ...params, ...result };
}

describe('useLessonKeyboardShortcuts', () => {
  test('calls goPrev on ArrowLeft when hasPrev', () => {
    const { goPrev } = setup({ hasPrev: true, hasNext: true });
    fireKey('ArrowLeft');
    expect(goPrev).toHaveBeenCalled();
  });

  test('calls goNext on ArrowRight when hasNext', () => {
    const { goNext } = setup({ hasPrev: true, hasNext: true });
    fireKey('ArrowRight');
    expect(goNext).toHaveBeenCalled();
  });

  test('does not navigate when showToolbar is true', () => {
    const { goPrev } = setup({ hasPrev: true, hasNext: true, showToolbar: true });
    fireKey('ArrowLeft');
    expect(goPrev).not.toHaveBeenCalled();
  });

  test('calls toggleSections on s key', () => {
    const { toggleSections } = setup();
    fireKey('s');
    expect(toggleSections).toHaveBeenCalled();
  });

  test('increments searchTrigger on Cmd+F', () => {
    setup();
    fireKey('f', { metaKey: true });
    expect(useLessonViewStore.getState().searchTrigger).toBe(1);
  });

  test('opens course search on Cmd+G', () => {
    const { setSearchCourseOpen } = setup();
    fireKey('g', { metaKey: true });
    expect(setSearchCourseOpen).toHaveBeenCalledWith(true);
  });

  test('scrolls content on ArrowUp/ArrowDown', () => {
    const scrollBy = mock(() => {});
    const el = document.createElement('div');
    el.scrollBy = scrollBy;

    setup({ contentRef: { current: el } });
    fireKey('ArrowUp');
    expect(scrollBy).toHaveBeenCalledWith({ top: -80, behavior: 'smooth' });
    fireKey('ArrowDown');
    expect(scrollBy).toHaveBeenCalledWith({ top: 80, behavior: 'smooth' });
  });
});
