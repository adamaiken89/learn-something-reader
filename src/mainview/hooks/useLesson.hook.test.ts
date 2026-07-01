import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useLessonViewStore } from '../stores/lessonViewStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import { useLesson } from './useLesson';

setupRPC();

async function renderHookAndSettle<Result>(callback: () => Result) {
  let result!: { current: Result };
  await act(async () => {
    result = renderHook(callback).result;
    await new Promise((r) => setTimeout(r, 0));
  });
  return result;
}

beforeEach(() => {
  clearMocks();
  useLessonViewStore.setState({
    content: '',
    h1: '',
    meta: [],
    bodyContent: '',
    sections: [],
    loading: true,
  });
});

const lessonData = {
  content: '# Test\n\nHello world',
  h1: 'Test Lesson',
  meta: [{ key: 'author', value: 'Test', icon: '👤', label: 'Author' }],
  bodyContent: 'Hello world',
  sections: [{ id: 'sec1', heading: 'Section 1', level: 2, parentID: null }],
};

const defaultCompletion = {
  toggle: async () => {},
};

describe('useLesson', () => {
  test('initial state has loading true', () => {
    mockResponse('loadLesson', new Promise(() => {}));
    const { result } = renderHook(() => useLesson('math', '01', defaultCompletion));
    expect(result.current.loading).toBe(true);
  });

  test('load populates store with content and sections', async () => {
    mockResponse('loadLesson', lessonData);
    await renderHookAndSettle(() => useLesson('math', '01', defaultCompletion));
    const state = useLessonViewStore.getState();
    expect(state.content).toBe(lessonData.content);
    expect(state.h1).toBe(lessonData.h1);
    expect(state.meta).toEqual(lessonData.meta);
    expect(state.bodyContent).toBe(lessonData.bodyContent);
    expect(state.sections).toEqual(lessonData.sections);
    expect(state.loading).toBe(false);
  });

  test('load failure sets loading false', async () => {
    const origWarn = console.warn;
    console.warn = () => {};
    mockResponse('loadLesson', undefined);
    await renderHookAndSettle(() => useLesson('math', '01', defaultCompletion));
    expect(useLessonViewStore.getState().content).toBe('');
    expect(useLessonViewStore.getState().loading).toBe(false);
    console.warn = origWarn;
  });

  test('toggle is available from completion prop', async () => {
    let toggleCalled = false;
    const toggle = async () => {
      toggleCalled = true;
    };
    mockResponse('loadLesson', lessonData);
    await renderHookAndSettle(() => useLesson('math', '01', { toggle }));
    expect(toggleCalled).toBe(false);
  });

  test('scrollToSection no-ops when contentRef is null', () => {
    mockResponse('loadLesson', new Promise(() => {}));
    const { result } = renderHook(() => useLesson('math', '01', defaultCompletion));
    act(() => expect(() => result.current.scrollToSection('sec1')).not.toThrow());
  });

  test('handleScroll no-ops when contentRef is null', () => {
    mockResponse('loadLesson', new Promise(() => {}));
    const { result } = renderHook(() => useLesson('math', '01', defaultCompletion));
    act(() => expect(() => result.current.handleScroll()).not.toThrow());
  });

  test('initialSectionID passed without error', async () => {
    mockResponse('loadLesson', lessonData);
    await renderHookAndSettle(() => useLesson('math', '01', defaultCompletion, 'sec1'));
    expect(useLessonViewStore.getState().content).toBe(lessonData.content);
  });
});
