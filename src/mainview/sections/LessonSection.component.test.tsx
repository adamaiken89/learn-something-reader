import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../bun/types';
import { useCompletionStore } from '../stores/completionStore';
import { useHighlightsStore } from '../stores/highlightsStore';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useNotesStore } from '../stores/notesStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';
import { clearMocks, deleteMock, mockResponse, setupRPC } from '../testUtils';
import LessonSection from './LessonSection';

setupRPC();

const mockCourse: Course = {
  id: 'cs101',
  course: 'CS 101',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'computer-science',
  prerequisites: [],
  learningObjectives: ['Learn basics'],
  modules: [],
  displayName: 'CS 101',
};

const mockModuleMeta: ModuleMeta = {
  id: 'mod-01',
  name: 'Module 1',
  timeHours: 2,
  prerequisites: [],
  topics: ['basics'],
};

const defaultLessonUI = { showPomodoro: false, searchCourseOpen: false };
const defaultSettings = {
  focusMode: false,
  fontSize: 16,
  contentWidth: 'standard' as const,
  rightPanel: false as const,
  theme: 'dark' as const,
};

function setupDefaultMocks() {
  mockResponse('loadLesson', {
    h1: 'Test Heading',
    bodyContent: 'Test body content',
    meta: [],
    sections: [],
  });
  mockResponse('isModuleCompleted', false);
  mockResponse('modulesList', []);
  mockResponse('getCompletedModuleIDs', []);
  mockResponse('getModuleBookmarks', []);
  mockResponse('getHighlights', []);
  mockResponse('getNotes', []);
  mockResponse('getSections', []);
  mockResponse('getCourseModuleSessions', []);
  mockResponse('hasCumulativeQuiz', false);
}

beforeEach(() => {
  clearMocks();
  setupDefaultMocks();
  useLessonUIStore.setState(defaultLessonUI);
  useSettingsStore.setState(defaultSettings);
  useHighlightsStore.setState({ byModule: {}, loading: {} });
  useCompletionStore.setState({ completed: {}, totalModules: {}, loading: {}, loaded: false });
  useNotesStore.setState({ byModule: {}, loading: {} });
  useViewStore.setState({
    views: [{ type: 'lesson', course: mockCourse, module: mockModuleMeta }],
  });
  useSelectionStore.setState({
    showToolbar: false,
    showNoteEditor: false,
    noteText: '',
    selection: null,
    pickerPos: { x: 0, y: 0, selectionTop: 0 },
    selectedHighlightId: null,
  });
});

function makeMockSelection(text: string, container: Node) {
  const textNode = document.createTextNode(text);
  container.appendChild(textNode);
  const mockRange = {
    getBoundingClientRect: () => ({
      left: 100,
      top: 50,
      width: 100,
      height: 20,
      bottom: 70,
      right: 200,
      toJSON: () => {},
    }),
    commonAncestorContainer: textNode,
  };
  return {
    isCollapsed: false,
    rangeCount: 1,
    getRangeAt: () => mockRange,
    toString: () => text,
    removeAllRanges: mock(() => {}),
    addRange: mock(() => {}),
  };
}

function installMockSelection(mockSel: ReturnType<typeof makeMockSelection>) {
  const orig = Object.getOwnPropertyDescriptor(window, 'getSelection');
  Object.defineProperty(window, 'getSelection', {
    configurable: true,
    value: () => mockSel as unknown as Selection,
  });
  return () => {
    if (orig) Object.defineProperty(window, 'getSelection', orig);
    else delete (window as unknown as { getSelection?: unknown }).getSelection;
  };
}

describe('LessonSection', () => {
  const user = userEvent.setup();
  const props = { course: mockCourse, module: mockModuleMeta };

  test('renders loading state', async () => {
    deleteMock('loadLesson');
    mockResponse('loadLesson', new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Loading lesson'));
  });

  test('renders lesson content when loaded', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Test Heading');
      expect(container!.textContent).toContain('Test body content');
    });
  });

  test('renders combined complete & quiz buttons', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('MCQ'));
  });

  test('renders quiz buttons when module is completed', async () => {
    mockResponse('isModuleCompleted', true);
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('MCQ');
    });
  });

  test('renders pomodoro timer when enabled', async () => {
    useLessonUIStore.setState({ showPomodoro: true });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Focus'));
  });

  test('renders navigation panel when rightPanel is sections', async () => {
    mockResponse('loadLesson', {
      h1: 'Test Heading',
      bodyContent: 'Test body content',
      meta: [],
      sections: [{ id: 's1', heading: 'Section One', level: 1, parentID: null }],
    });
    useSettingsStore.setState({ rightPanel: 'sections' });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Test Heading');
      expect(container!.querySelector('[data-testid="navigation-panel"]')).toBeTruthy();
    });
  });

  test('renders viewer search when search is active via initialSearchQuery', async () => {
    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(
        <LessonSection {...props} initialSearchQuery="test query" />,
      ).getByTestId;
    });
    await waitFor(() => expect(getByTestId!('viewer-search')).toBeTruthy());
  });

  test('renders selection toolbar when there is a selection', async () => {
    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(<LessonSection {...props} />).getByTestId;
    });

    const contentArea = getByTestId!('book-content-area');
    const mockSel = makeMockSelection('some selectable text', contentArea);
    const restore = installMockSelection(mockSel);

    await act(async () => fireEvent.mouseUp(contentArea));

    await waitFor(() => expect(getByTestId!('selection-toolbar')).toBeTruthy());
    restore();
  });

  test('renders note editor when open', async () => {
    let getByTestId: ReturnType<typeof render>['getByTestId'];
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<LessonSection {...props} />);
      getByTestId = r.getByTestId;
      getByText = r.getByText;
    });

    const contentArea = getByTestId!('book-content-area');
    const mockSel = makeMockSelection('note-worthy text', contentArea);
    const restore = installMockSelection(mockSel);

    await act(async () => fireEvent.mouseUp(contentArea));

    await waitFor(() => expect(getByTestId!('selection-toolbar')).toBeTruthy());

    await user.click(getByText!('Add Note'));

    await waitFor(() => expect(getByTestId!('note-editor')).toBeTruthy());
    restore();
  });

  test('renders navigation panel (collapsed) when sections panel hidden', async () => {
    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(<LessonSection {...props} />).getByTestId;
    });
    expect(getByTestId!('navigation-panel')).toBeInTheDocument();
  });

  test('calls handleToggle when mark complete button clicked', async () => {
    mockResponse('toggleModuleCompleted', true);
    mockResponse('logSession', undefined);

    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(<LessonSection {...props} />).getByText;
    });

    await user.click(getByText!('Mark as Complete'));

    await waitFor(() => {
      expect(useCompletionStore.getState().completed).toHaveProperty('cs101:mod-01', true);
    });
  });

  test('last module shows Mark as Complete that flips to Completed', async () => {
    mockResponse('toggleModuleCompleted', true);
    mockResponse('logSession', undefined);

    const course: Course = {
      ...mockCourse,
      modules: [mockModuleMeta, { ...mockModuleMeta, id: 'mod-02', name: 'Module 2' }],
    };
    const lastModule: ModuleMeta = course.modules[1];
    useViewStore.setState({ views: [{ type: 'lesson', course, module: lastModule }] });

    let getByTestId: ReturnType<typeof render>['getByTestId'];
    let getByText: ReturnType<typeof render>['getByText'];
    let queryByText: ReturnType<typeof render>['queryByText'];
    await act(async () => {
      const r = render(<LessonSection course={course} module={lastModule} />);
      getByTestId = r.getByTestId;
      getByText = r.getByText;
      queryByText = r.queryByText;
    });

    await waitFor(() => expect(queryByText!('Complete & Next')).toBeNull());
    await user.click(getByText!('Mark as Complete'));

    await waitFor(() => {
      expect(useCompletionStore.getState().completed).toHaveProperty('cs101:mod-02', true);
    });
    await waitFor(() => {
      expect(getByTestId!('complete-btn').textContent).toContain('Completed');
    });
  });

  test('auto-copies selected text after delay on mouseUp', async () => {
    let clipboardText = '';
    const originalWriteText = navigator.clipboard.writeText;
    Object.assign(navigator.clipboard, {
      writeText: mock(async (text: string) => {
        clipboardText = text;
      }),
    });

    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(<LessonSection {...props} />).getByTestId;
    });
    const contentArea = getByTestId!('book-content-area');
    const mockSel = makeMockSelection('auto copied text', contentArea);
    const restore = installMockSelection(mockSel);

    await act(async () => fireEvent.mouseUp(contentArea));

    await waitFor(() => expect(getByTestId!('selection-toolbar')).toBeTruthy());

    await waitFor(() => expect(clipboardText).toBe('auto copied text'));

    Object.assign(navigator.clipboard, { writeText: originalWriteText });
    restore();
  });

  test('auto-copy does not fire when selection is empty', async () => {
    let clipboardText = '';
    const originalWriteText = navigator.clipboard.writeText;
    Object.assign(navigator.clipboard, {
      writeText: mock(async (text: string) => {
        clipboardText = text;
      }),
    });

    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(<LessonSection {...props} />).getByTestId;
    });
    const contentDiv = getByTestId!('lesson-content');

    const collapsedSel = {
      isCollapsed: true,
      rangeCount: 0,
      toString: () => '',
    };
    const origGetSelectionDesc = Object.getOwnPropertyDescriptor(window, 'getSelection');
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () => collapsedSel as unknown as Selection,
    });

    await act(async () => fireEvent.mouseUp(contentDiv));

    await waitFor(() => expect(clipboardText).toBe(''));

    Object.assign(navigator.clipboard, { writeText: originalWriteText });
    if (origGetSelectionDesc) Object.defineProperty(window, 'getSelection', origGetSelectionDesc);
    else delete (window as unknown as { getSelection?: unknown }).getSelection;
  });

  test('auto-copy debounces rapid selections', async () => {
    let copyCount = 0;
    let lastCopied = '';
    const originalWriteText = navigator.clipboard.writeText;
    Object.assign(navigator.clipboard, {
      writeText: mock(async (text: string) => {
        copyCount++;
        lastCopied = text;
      }),
    });

    let getByTestId: ReturnType<typeof render>['getByTestId'];
    await act(async () => {
      getByTestId = render(<LessonSection {...props} />).getByTestId;
    });
    const contentArea = getByTestId!('book-content-area');

    const mockSel1 = makeMockSelection('first selection', contentArea);
    const restore1 = installMockSelection(mockSel1);
    await act(async () => fireEvent.mouseUp(contentArea));

    await waitFor(() => expect(copyCount).toBe(0));

    const mockSel2 = makeMockSelection('second selection', contentArea);
    restore1();
    const restore2 = installMockSelection(mockSel2);
    await act(async () => fireEvent.mouseUp(contentArea));

    await waitFor(() => expect(copyCount).toBe(1));

    expect(lastCopied).toBe('second selection');

    Object.assign(navigator.clipboard, { writeText: originalWriteText });
    restore2();
  });

  test('non-last module Complete & Next click triggers handleNextChapter', async () => {
    mockResponse('toggleModuleCompleted', true);
    mockResponse('logSession', undefined);
    const course: Course = {
      ...mockCourse,
      modules: [mockModuleMeta, { ...mockModuleMeta, id: 'mod-02', name: 'Module 2' }],
    };
    useViewStore.setState({ views: [{ type: 'lesson', course, module: mockModuleMeta }] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<LessonSection course={course} module={mockModuleMeta} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Complete & Next'));
    const nextBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Complete & Next'),
    )!;
    await act(async () => {
      nextBtn.click();
    });
    await waitFor(() => {
      expect(useCompletionStore.getState().completed).toHaveProperty('cs101:mod-01', true);
    });
  });

  test('onModuleSelect in nav panel pushes lesson view', async () => {
    const course: Course = {
      ...mockCourse,
      modules: [mockModuleMeta, { ...mockModuleMeta, id: 'mod-02', name: 'Module 2' }],
    };
    useViewStore.setState({ views: [{ type: 'lesson', course, module: mockModuleMeta }] });
    mockResponse('getSections', [{ id: 'intro', heading: 'Intro', level: 1, parentID: null }]);
    useSettingsStore.setState({ rightPanel: 'sections' });
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(<LessonSection course={course} module={mockModuleMeta} />).getByText;
    });
    await waitFor(() => expect(getByText!('Module 2')).toBeTruthy());
    await user.click(getByText!('Module 2'));
    expect(
      useViewStore.getState().views.some((v) => v.type === 'lesson' && v.module.id === 'mod-02'),
    ).toBe(true);
  });
});
