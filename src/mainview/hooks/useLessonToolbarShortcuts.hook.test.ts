import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../bun/types';
import { useBookmarksStore } from '../stores/bookmarksStore';
import { useCourseStore } from '../stores/courseStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';
import { mockResponse, setupRPC } from '../testUtils';
import { useLessonToolbarShortcuts } from './useLessonToolbarShortcuts';

setupRPC();

const MODULE: ModuleMeta = {
  id: 'm1',
  name: 'Intro',
  timeHours: 1,
  prerequisites: [],
  topics: [],
};

function makeCourse(id = 'c1'): Course {
  return {
    id,
    course: id,
    timeBudgetHours: 5,
    targetLevel: 'beginner',
    domain: 'tech',
    prerequisites: [],
    learningObjectives: [],
    modules: [MODULE],
    displayName: `Course ${id}`,
  };
}

let capturedListener: ((e: Partial<KeyboardEvent>) => void) | null = null;
let origAddEventListener: typeof window.addEventListener;

beforeEach(() => {
  capturedListener = null;
  origAddEventListener = window.addEventListener;
  window.addEventListener = mock((type: string, listener: EventListener) => {
    if (type === 'keydown') {
      capturedListener = listener as unknown as (e: Partial<KeyboardEvent>) => void;
    }
  }) as unknown as typeof window.addEventListener;

  useSettingsStore.setState({
    fontSize: 16,
    theme: 'dark',
    focusMode: false,
    contentWidth: 'narrow' as const,
    transitionStyle: 'none' as const,
  });
  useCourseStore.setState({ courses: [makeCourse('c1'), makeCourse('c2')] });
  useBookmarksStore.setState({ byModule: {} });
  useViewStore.setState({ views: [] });
});

afterEach(() => {
  window.addEventListener = origAddEventListener;
});

function fireKey(key: string) {
  act(() => {
    capturedListener?.({
      key,
      metaKey: false,
      ctrlKey: false,
      target: document.body,
      preventDefault: mock(() => {}),
    });
  });
}

function setup(course: Course | null = makeCourse(), module: ModuleMeta | null = MODULE) {
  renderHook(() => useLessonToolbarShortcuts(course as Course, module as ModuleMeta));
}

async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('useLessonToolbarShortcuts', () => {
  test('incFontSize on =', () => {
    setup();
    fireKey('=');
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  test('decFontSize on -', () => {
    setup();
    fireKey('-');
    expect(useSettingsStore.getState().fontSize).toBe(14);
  });

  test('cycleTheme on t', () => {
    setup();
    fireKey('t');
    expect(useSettingsStore.getState().theme).not.toBe('dark');
  });

  test('toggleWidth cycles narrow→standard', () => {
    setup();
    fireKey('w');
    expect(useSettingsStore.getState().contentWidth).toBe('standard');
  });

  test('toggleWidth wraps full→narrow', () => {
    useSettingsStore.setState({ contentWidth: 'full' as const });
    setup();
    fireKey('w');
    expect(useSettingsStore.getState().contentWidth).toBe('narrow');
  });

  test('cycleTransition none→flip on x', () => {
    setup();
    fireKey('x');
    expect(useSettingsStore.getState().transitionStyle).toBe('flip');
  });

  test('focusMode toggles on f', () => {
    setup();
    fireKey('f');
    expect(useSettingsStore.getState().focusMode).toBe(true);
  });

  test('bookmark adds when none exists', async () => {
    mockResponse('addBookmark', {
      id: 'bm-new',
      courseID: 'c1',
      moduleID: 'm1',
      title: 'Intro',
      sectionID: null,
      scrollPosition: 0,
      createdAt: new Date().toISOString(),
    });
    const course = makeCourse();
    setup(course);
    fireKey('b');
    await settle();
    const bms = useBookmarksStore.getState().byModule['c1:m1'] ?? [];
    expect(bms).toHaveLength(1);
    expect(bms[0].sectionID).toBeNull();
  });

  test('bookmark removes when page-level bookmark exists', async () => {
    mockResponse('deleteBookmark', { ok: true });
    useBookmarksStore.setState({
      byModule: {
        'c1:m1': [
          {
            id: 'bm1',
            courseID: 'c1',
            moduleID: 'm1',
            title: 'Intro',
            sectionID: null,
            scrollPosition: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    setup(makeCourse());
    fireKey('b');
    await settle();
    expect(useBookmarksStore.getState().byModule['c1:m1']).toHaveLength(0);
  });

  test('bookmark no-op without course/module', () => {
    setup(null, null);
    fireKey('b');
    expect(useBookmarksStore.getState().byModule['c1:m1']).toBeUndefined();
  });

  test('reviewCards pushes review with course found in store', () => {
    setup();
    fireKey('c');
    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({ type: 'review', course: { id: 'c1' } });
  });

  test('reviewCards no-op when course missing from store list', () => {
    useCourseStore.setState({ courses: [] });
    setup();
    fireKey('c');
    expect(useViewStore.getState().views).toHaveLength(0);
  });

  test('quiz pushes quiz view', () => {
    setup();
    fireKey('q');
    expect(useViewStore.getState().views[0]).toMatchObject({
      type: 'quiz',
      course: { id: 'c1' },
      module: { id: 'm1' },
    });
  });

  test('review pushes review view directly', () => {
    setup();
    fireKey('r');
    expect(useViewStore.getState().views[0]).toMatchObject({
      type: 'review',
      course: { id: 'c1' },
    });
  });

  test('quiz/review no-op without course', () => {
    setup(null, null);
    fireKey('q');
    fireKey('r');
    expect(useViewStore.getState().views).toHaveLength(0);
  });
});
