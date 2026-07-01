import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';
import NoteEditor from './NoteEditor';

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
  toString: () => '',
  setStart: () => {},
  setEnd: () => {},
};

function setupStore() {
  useLessonViewStore.setState({ courseId: 'cs101', moduleId: 'mod-01' });
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
  });
  useLessonViewStore.setState({ courseId: '', moduleId: '' });
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

  test('typing calls setNoteText', async () => {
    setupStore();
    const { container } = render(<NoteEditor />);
    const textarea = container.querySelector('textarea')!;
    await user.type(textarea, 'my note');
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
    const { getByText } = render(<NoteEditor />);
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
});
