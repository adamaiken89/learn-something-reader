import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, spyOn, test } from 'bun:test';

import * as helpersModule from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import NoteEditor from './NoteEditor';

setupRPC();

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
  commonAncestorContainer: document.body,
  startContainer: document.body,
  startOffset: 0,
  endContainer: document.body,
  endOffset: 20,
  toString: () => 'some highlighted text',
  setStart: () => {},
  setEnd: () => {},
};

function setupStore() {
  const el = document.createElement('div');
  el.textContent = 'some highlighted text';
  useLessonViewStore.setState({
    courseId: 'cs101',
    moduleId: 'mod-01',
    contentRef: { current: el },
  });
  useSelectionStore.setState({
    showNoteEditor: true,
    selection: { text: 'some highlighted text', range: mockRange as unknown as Range },
    pickerPos: { x: 200, y: 300, selectionTop: 280 },
    noteText: '',
    showToolbar: false,
    showCardEditor: false,
    selectedHighlightId: null,
  });
}

beforeEach(() => {
  useSelectionStore.setState({
    showNoteEditor: false,
    showCardEditor: false,
    showToolbar: false,
    noteText: '',
    selection: null,
    pickerPos: { x: 0, y: 0, selectionTop: 0 },
    selectedHighlightId: null,
    popoverNote: null,
  });
  useLessonViewStore.setState({ courseId: '', moduleId: '' });
  useHighlightsStore.setState({ byModule: {}, loading: {} });
});

describe('NoteEditor', () => {
  const user = userEvent.setup();

  test('renders selected text and textarea', () => {
    setupStore();
    const { getByTestId, getByText } = render(<NoteEditor />);
    expect(getByTestId('note-editor')).toBeInTheDocument();
    expect(getByText((c) => c.includes('some highlighted text'))).toBeInTheDocument();
  });

  test('returns null when showNoteEditor is false', () => {
    const { container } = render(<NoteEditor />);
    expect(container.innerHTML).toBe('');
  });

  test('truncates long selected text', () => {
    const longText = 'a'.repeat(100);
    setupStore();
    useSelectionStore.setState({
      selection: { text: longText, range: mockRange as unknown as Range },
    });
    const { container } = render(<NoteEditor />);
    expect(container.textContent).toContain('a'.repeat(80) + '...');
  });

  test('typing calls setNoteText', () => {
    setupStore();
    render(<NoteEditor />);
    act(() => {
      useSelectionStore.getState().setNoteText('my note');
    });
    expect(useSelectionStore.getState().noteText).toBe('my note');
  });

  test('save disabled when noteText empty', () => {
    setupStore();
    const { getByText } = render(<NoteEditor />);
    const saveBtn = getByText('Save Note').closest('button');
    expect(saveBtn).toBeDisabled();
  });

  test('save enabled when noteText present', () => {
    setupStore();
    useSelectionStore.setState({ noteText: 'has content' });
    const { getByText } = render(<NoteEditor />);
    const saveBtn = getByText('Save Note').closest('button');
    expect(saveBtn).not.toBeDisabled();
  });

  test('cancel closes editor', async () => {
    setupStore();
    const { getByText, getByTestId } = render(<NoteEditor />);
    expect(getByTestId('note-editor')).toBeInTheDocument();
    await user.click(getByText('Cancel'));
    expect(useSelectionStore.getState().showNoteEditor).toBe(false);
  });

  test('calls addAnnotation on save', async () => {
    setupStore();
    useSelectionStore.setState({
      noteText: 'my note',
      selection: { text: 'some highlighted text', range: mockRange as unknown as Range },
    });
    const { getByText } = render(<NoteEditor />);
    await user.click(getByText('Save Note'));
  });

  test('full save flow — addAnnotation + close + load highlights', async () => {
    clearMocks();
    mockResponse('addAnnotation', undefined);
    mockResponse('getHighlights', []);
    useHighlightsStore.setState({ byModule: {} });

    // Spy on getTextOffset since happy-dom Range can't compute real offsets
    spyOn(helpersModule, 'getTextOffset').mockReturnValue({ start: 0, end: 20 });

    setupStore();
    useSelectionStore.setState({
      noteText: 'my detailed note',
      selection: { text: 'some highlighted text', range: mockRange as unknown as Range },
    });
    const { getByText } = render(<NoteEditor />);
    await user.click(getByText('Save Note'));
    await waitFor(() => {
      expect(useSelectionStore.getState().showNoteEditor).toBe(false);
    });
  });
});
