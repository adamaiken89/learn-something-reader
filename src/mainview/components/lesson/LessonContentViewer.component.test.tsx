import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { UseLessonSearchReturn } from '../../hooks/useLessonSearch';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSettingsStore } from '../../stores/settingsStore';
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
  mockResponse('hasClozeQuiz', false);
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
});
