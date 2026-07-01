import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useSelectionStore } from '../../stores/selectionStore';
import NotePopover from './NotePopover';

const makeNote = (overrides = {}) => ({
  id: 'n1',
  courseID: 'math',
  moduleID: '01',
  content: 'my note content',
  highlightID: null,
  sectionID: 'intro',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

function setupStore() {
  useSelectionStore.setState({
    popoverNote: { note: makeNote(), x: 200, y: 300 },
  });
}

beforeEach(() => {
  useSelectionStore.setState({
    popoverNote: null,
    showToolbar: false,
    showNoteEditor: false,
    showCardEditor: false,
    noteText: '',
    selection: null,
    pickerPos: { x: 0, y: 0, selectionTop: 0 },
    selectedHighlightId: null,
  });
});

describe('NotePopover', () => {
  const user = userEvent.setup();

  test('returns null when no popoverNote', () => {
    const { container } = render(<NotePopover />);
    expect(container.innerHTML).toBe('');
  });

  test('renders note content', () => {
    setupStore();
    const { getByTestId, getByText } = render(<NotePopover />);
    expect(getByTestId('note-popover')).toBeInTheDocument();
    expect(getByText((c) => c.includes('Notes'))).toBeInTheDocument();
    expect(getByText('my note content')).toBeInTheDocument();
  });

  test('Escape key closes popover', async () => {
    setupStore();
    render(<NotePopover />);
    await user.keyboard('{Escape}');
    expect(useSelectionStore.getState().popoverNote).toBeNull();
  });

  test('mousedown outside calls setPopoverNote(null)', async () => {
    setupStore();
    render(<NotePopover />);
    await user.click(document.body);
    expect(useSelectionStore.getState().popoverNote).toBeNull();
  });

  test('mousedown inside does not close', async () => {
    setupStore();
    const { getByTestId } = render(<NotePopover />);
    await user.click(getByTestId('note-popover'));
    expect(useSelectionStore.getState().popoverNote).not.toBeNull();
  });
});
