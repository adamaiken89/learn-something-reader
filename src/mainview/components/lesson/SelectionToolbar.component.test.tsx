import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import SelectionToolbar from './SelectionToolbar';

setupRPC();

let textNode: Text;
let contentEl: HTMLDivElement;
let mockRange: ReturnType<typeof createMockRange>;

function createMockRange(selText: string) {
  contentEl = document.createElement('div');
  textNode = document.createTextNode('some longer text before ' + selText + ' and after');
  contentEl.appendChild(textNode);

  return {
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
    startContainer: textNode,
    startOffset: 'some longer text before '.length,
    endContainer: textNode,
    endOffset: 'some longer text before '.length + selText.length,
    toString: () => selText,
    setStart: () => {},
    setEnd: () => {},
    cloneRange: () => mockRange,
  };
}

function setupStore() {
  mockRange = createMockRange('selected text') as unknown as typeof mockRange;
  useLessonViewStore.setState({
    courseId: 'cs101',
    moduleId: 'mod-01',
    contentRef: { current: contentEl },
  });
  useSelectionStore.setState({
    showToolbar: true,
    selection: { text: 'selected text', range: mockRange as unknown as Range },
    pickerPos: { x: 200, y: 300, selectionTop: 280 },
    selectedHighlightId: null,
    showNoteEditor: false,
    noteText: '',
  });
  useHighlightsStore.setState({ byModule: { 'cs101:mod-01': [] }, loading: {} });
}

beforeEach(() => {
  clearMocks();
  setupStore();
});

describe('SelectionToolbar', () => {
  const user = userEvent.setup();

  test('renders action buttons', () => {
    const { getByText } = render(<SelectionToolbar />);
    expect(getByText('Add Note')).toBeInTheDocument();
  });

  test('clicking note button opens note editor', async () => {
    const { getByText } = render(<SelectionToolbar />);
    await user.click(getByText('Add Note'));
    expect(useSelectionStore.getState().showNoteEditor).toBe(true);
  });

  test('returns null when showToolbar is false', () => {
    useSelectionStore.setState({ showToolbar: false });
    const { container } = render(<SelectionToolbar />);
    expect(container.innerHTML).toBe('');
  });

  test('returns null when selection is null', () => {
    useSelectionStore.setState({ selection: null });
    const { container } = render(<SelectionToolbar />);
    expect(container.innerHTML).toBe('');
  });

  test('clicking inactive color adds highlight', async () => {
    const created = {
      id: 'h-new',
      courseID: 'cs101',
      moduleID: 'mod-01',
      selectedText: 'selected text',
      color: 'yellow',
      startOffset: 0,
      endOffset: 13,
      createdAt: '',
    };
    mockResponse('addHighlight', created);
    const { container } = render(<SelectionToolbar />);
    const yellowBtn = container.querySelector('button[title="yellow"]');
    expect(yellowBtn).toBeTruthy();
    await user.click(yellowBtn!);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const highlights = useHighlightsStore.getState().byModule['cs101:mod-01'] ?? [];
    expect(highlights.some((h) => h.color === 'yellow')).toBe(true);
  });

  test('clicking highlight color copies text to clipboard', async () => {
    const writeText = mock(() => Promise.resolve());
    Object.assign(navigator.clipboard, { writeText });

    mockResponse('addHighlight', {
      id: 'h-new',
      courseID: 'cs101',
      moduleID: 'mod-01',
      selectedText: 'selected text',
      color: 'yellow',
      startOffset: 0,
      endOffset: 13,
      createdAt: '',
    });

    const { container } = render(<SelectionToolbar />);
    const yellowBtn = container.querySelector('button[title="yellow"]');
    expect(yellowBtn).toBeTruthy();
    await user.click(yellowBtn!);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(writeText).toHaveBeenCalledWith('selected text');
    Object.assign(navigator.clipboard, { writeText });
  });

  test('clicking active color deletes highlight', async () => {
    useHighlightsStore.setState({
      byModule: {
        'cs101:mod-01': [
          {
            id: 'h1',
            courseID: 'cs101',
            moduleID: 'mod-01',
            selectedText: 'selected text',
            color: 'yellow',
            startOffset: 0,
            endOffset: 10,
            createdAt: '',
          },
        ],
      },
    });
    useSelectionStore.setState({ selectedHighlightId: 'h1' });
    mockResponse('deleteHighlight', undefined);

    const origGetSelectionDesc = Object.getOwnPropertyDescriptor(window, 'getSelection');
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () =>
        ({
          isCollapsed: false,
          rangeCount: 1,
          getRangeAt: () => mockRange,
          toString: () => 'selected text',
          removeAllRanges: () => {},
          addRange: () => {},
        }) as unknown as Selection,
    });

    const { container } = render(<SelectionToolbar />);
    const yellowBtn = container.querySelector('button[title="yellow"]');
    expect(yellowBtn).toBeTruthy();
    await user.click(yellowBtn!);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(useHighlightsStore.getState().byModule['cs101:mod-01'] ?? []).toHaveLength(0);
    if (origGetSelectionDesc) Object.defineProperty(window, 'getSelection', origGetSelectionDesc);
    else delete (window as unknown as { getSelection?: unknown }).getSelection;
  });
});
