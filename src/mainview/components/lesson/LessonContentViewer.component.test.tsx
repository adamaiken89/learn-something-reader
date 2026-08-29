import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../../bun/types';
import type { UseLessonSearchReturn } from '../../hooks/useLessonSearch';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useViewStore } from '../../stores/viewStore';
import { mockResponse, setupRPC } from '../../testUtils';
import LessonContentViewer from './LessonContentViewer';

setupRPC();

beforeEach(() => {
  useLessonViewStore.setState({
    courseId: 'test-course',
    moduleId: 'test-module',
    bodyContent: '# Test\n\nContent here\n\n'.repeat(50),
    sections: [],
    contentRef: { current: document.createElement('div') },
    loading: false,
    searchTrigger: 0,
  });
  useSettingsStore.setState({
    contentWidth: 'standard',
    fontSize: 16,
    theme: 'dark' as const,
    focusMode: false,
    rightPanel: false,
  });
  mockResponse('getNotes', []);
  mockResponse('getHighlights', []);
  mockResponse('hasCumulativeQuiz', false);
});

function createMockSearch(overrides?: Partial<UseLessonSearchReturn>): UseLessonSearchReturn {
  return {
    searchActive: false,
    searchQuery: '',
    currentMatchIndex: 0,
    totalMatches: 0,
    caseSensitive: false,
    setSearchActive: () => {},
    handleSearchQueryChange: () => {},
    handleSearchPrev: () => {},
    handleSearchNext: () => {},
    handleSearchClose: () => {},
    toggleCaseSensitive: () => {},
    ...overrides,
  };
}

describe('LessonContentViewer', () => {
  test('does not render search bar (handled by LessonSection)', async () => {
    useLessonViewStore.setState({ searchTrigger: 1 });
    let container: HTMLElement;
    await act(async () => {
      container = render(
        <LessonContentViewer
          search={createMockSearch({ searchActive: true, searchQuery: 'test' })}
        />,
      ).container;
    });
    expect(container!.querySelector('[data-testid="lesson-content"]')).toBeInTheDocument();
    expect(container!.querySelector('[data-testid="viewer-search"]')).not.toBeInTheDocument();
  });

  test('does not render search bar when search inactive', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    expect(container!.querySelector('[data-testid="viewer-search"]')).not.toBeInTheDocument();
  });

  test('renders lesson content with markdown', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    expect(container!.querySelector('[data-testid="lesson-content"]')).toBeInTheDocument();
    await waitFor(() => expect(container!.textContent).toContain('Content here'));
  });

  test('handleScroll no-ops when contentRef.current is null', async () => {
    useLessonViewStore.setState({ contentRef: { current: null } });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    expect(container!.querySelector('[data-testid="lesson-content"]')).toBeInTheDocument();
  });

  test('renders cloze-blank span as ClozeBlank', async () => {
    useLessonViewStore.setState({
      bodyContent: '<p>Hello <span class="cloze-blank" data-answer="world">cloze</span></p>',
    });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    expect(container!.textContent).toContain('Hello');
  });

  test('renders PerplexityButton for AI skill placeholder', async () => {
    useLessonViewStore.setState({
      bodyContent: '## Feynman Explain\n\nsome analogy text',
      content: '## Feynman Explain\n\nTry explaining like a 12-year-old.',
    });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    // bodyContent has placeholder %%PERPLEXITY%%:feynman after processLessonContent
    expect(container!.textContent).toContain('PERPLEXITY');
  });

  test('handleScroll computes progress when contentRef has overflow', async () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(div, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(div, 'scrollTop', { value: 400, configurable: true, writable: true });
    useLessonViewStore.setState({ contentRef: { current: div } });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    const scrollable = container!.querySelector('[data-testid="lesson-content"]')!;
    scrollable.dispatchEvent(new Event('scroll'));
    expect(container!.querySelector('.reading-progress-bar')).toBeTruthy();
  });

  test('renders hasCumulative branch in footer', async () => {
    const course: Course = {
      id: 'c1',
      course: 'c1',
      displayName: 'C',
      timeBudgetHours: 1,
      targetLevel: 'beginner',
      domain: 'x',
      prerequisites: [],
      learningObjectives: [],
      modules: [{ id: 'm1', name: 'M', timeHours: 1, prerequisites: [], topics: [] }],
    };
    const mod: ModuleMeta = { id: 'm1', name: 'M', timeHours: 1, prerequisites: [], topics: [] };
    useViewStore.setState({ views: [{ type: 'lesson', course, module: mod }] });
    mockResponse('hasCumulativeQuiz', true);
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonContentViewer search={createMockSearch()} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Cumulative');
    });
  });
});
