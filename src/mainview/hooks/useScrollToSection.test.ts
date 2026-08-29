import { act, renderHook } from '@testing-library/react';
import { describe, expect, mock, test } from 'bun:test';

import { useLessonUIStore } from '../stores/lessonUIStore';
import { useScrollToSection } from './useScrollToSection';

describe('useScrollToSection', () => {
  test('returns noop when ref has no current', () => {
    const { result } = renderHook(() => useScrollToSection({ current: null }));
    expect(() => result.current('section-1')).not.toThrow();
  });

  test('returns noop when target id not in container', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const { result } = renderHook(() =>
      useScrollToSection({ current: div } as React.RefObject<HTMLDivElement | null>),
    );
    expect(() => result.current('missing')).not.toThrow();
  });

  test('scrolls to element and updates visible section', () => {
    const div = document.createElement('div');
    div.innerHTML = '<section id="sec-1">hi</section>';
    document.body.appendChild(div);

    const scrollTo = mock((_opts: ScrollToOptions) => {});
    const focus = mock(() => {});
    div.scrollTo = scrollTo as unknown as HTMLDivElement['scrollTo'];
    div.focus = focus as unknown as HTMLDivElement['focus'];

    const el = div.querySelector('#sec-1') as HTMLElement;
    el.getBoundingClientRect = () =>
      ({
        top: 200,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    div.getBoundingClientRect = () =>
      ({
        top: 50,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(div, 'scrollTop', { value: 100, configurable: true, writable: true });

    const { result } = renderHook(() =>
      useScrollToSection({ current: div } as React.RefObject<HTMLDivElement | null>),
    );

    act(() => {
      result.current('sec-1');
    });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    const opts = scrollTo.mock.calls[0]?.[0] as ScrollToOptions;
    expect(opts?.top).toBe(200 - 50 + 100 - 20);
    expect(useLessonUIStore.getState().visibleSection).toBe('sec-1');
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
