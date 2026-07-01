import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { useWheelNavigation } from './useWheelNavigation';

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function fireWheel(el: HTMLElement, deltaX: number, deltaY: number) {
  const e = new Event('wheel', { bubbles: true });
  Object.assign(e, { deltaX, deltaY });
  el.dispatchEvent(e);
}

describe('useWheelNavigation', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = makeEl();
  });

  test('does nothing when ref has no current', () => {
    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: null },
        nav: { hasPrev: true, hasNext: true, goPrev: mock(() => {}), goNext: mock(() => {}) },
      }),
    );
  });

  test('navigates next on large positive deltaX', () => {
    const goNext = mock(() => {});
    const goPrev = mock(() => {});

    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: true, hasNext: true, goPrev, goNext },
      }),
    );

    fireWheel(el, 100, 10);
    expect(goNext).toHaveBeenCalled();
    expect(goPrev).not.toHaveBeenCalled();
  });

  test('navigates prev on large negative deltaX', () => {
    const goNext = mock(() => {});
    const goPrev = mock(() => {});

    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: true, hasNext: true, goPrev, goNext },
      }),
    );

    fireWheel(el, -100, 10);
    expect(goPrev).toHaveBeenCalled();
    expect(goNext).not.toHaveBeenCalled();
  });

  test('does not navigate when deltaX is small relative to deltaY', () => {
    const goNext = mock(() => {});
    const goPrev = mock(() => {});

    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: true, hasNext: true, goPrev, goNext },
      }),
    );

    fireWheel(el, 10, 50);
    expect(goNext).not.toHaveBeenCalled();
    expect(goPrev).not.toHaveBeenCalled();
  });

  test('does not navigate next when hasNext is false', () => {
    const goNext = mock(() => {});

    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: true, hasNext: false, goPrev: mock(() => {}), goNext },
      }),
    );

    fireWheel(el, 100, 10);
    expect(goNext).not.toHaveBeenCalled();
  });

  test('does not navigate prev when hasPrev is false', () => {
    const goPrev = mock(() => {});

    renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: false, hasNext: true, goPrev, goNext: mock(() => {}) },
      }),
    );

    fireWheel(el, -100, 10);
    expect(goPrev).not.toHaveBeenCalled();
  });

  test('cleans up listener on unmount', () => {
    const goNext = mock(() => {});
    const { unmount } = renderHook(() =>
      useWheelNavigation({
        contentRef: { current: el },
        nav: { hasPrev: true, hasNext: true, goPrev: mock(() => {}), goNext },
      }),
    );

    unmount();
    fireWheel(el, 100, 10);
    expect(goNext).not.toHaveBeenCalled();
  });
});
