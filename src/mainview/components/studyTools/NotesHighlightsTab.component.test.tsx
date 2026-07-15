import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useNotesStore } from '../../stores/notesStore';
import { useViewStore } from '../../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import NotesHighlightsTab from './NotesHighlightsTab';

setupRPC();

const mockHighlight = {
  id: 'h1',
  courseID: 'math',
  moduleID: '01',
  selectedText: 'important concept',
  color: '#ff0',
  startOffset: 10,
  endOffset: 28,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockNote = {
  id: 'n1',
  courseID: 'math',
  moduleID: '01',
  content: 'my note content',
  sectionID: null,
  highlightID: null,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockNoteLinked = {
  id: 'n2',
  courseID: 'math',
  moduleID: '01',
  content: 'linked note',
  sectionID: 'intro',
  highlightID: 'h1',
  createdAt: '2024-01-03T00:00:00Z',
  updatedAt: '2024-01-03T00:00:00Z',
};

describe('NotesHighlightsTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    clearMocks();
    useLessonViewStore.setState({
      content: '',
      sections: [],
      contentRef: { current: null },
      scrollToSection: () => {},
    });
    useViewStore.setState({
      views: [
        {
          type: 'lesson',
          course: {
            id: 'math',
            course: 'math',
            displayName: 'Math',
            timeBudgetHours: 0,
            targetLevel: '',
            domain: '',
            prerequisites: [],
            learningObjectives: [],
            modules: [],
          },
          module: { id: '01', name: '', timeHours: 0, prerequisites: [], topics: [] },
        },
      ],
    });
    useNotesStore.setState({ byModule: {}, loading: {} });
    useHighlightsStore.setState({ byModule: {}, loading: {} });
  });

  test('renders empty state', async () => {
    mockResponse('getNotes', []);
    mockResponse('getHighlights', []);
    const { findByText } = render(<NotesHighlightsTab />);
    expect(
      await findByText('No annotations yet. Select text to highlight or add a note.'),
    ).toBeInTheDocument();
  });

  test('renders loading state', () => {
    mockResponse('getNotes', new Promise(() => {}));
    mockResponse('getHighlights', []);
    useNotesStore.setState({ loading: { 'math:01': true } });
    const { getByText } = render(<NotesHighlightsTab />);
    expect(getByText('Loading notes...')).toBeInTheDocument();
  });

  test('renders highlights from store', async () => {
    mockResponse('getNotes', []);
    useHighlightsStore.setState({ byModule: { 'math:01': [mockHighlight] } });
    const { findByText } = render(<NotesHighlightsTab />);
    expect(await findByText('important concept')).toBeInTheDocument();
  });

  test('renders notes from store', async () => {
    mockResponse('getNotes', [mockNote]);
    mockResponse('getHighlights', []);
    const { findByText } = render(<NotesHighlightsTab />);
    expect(await findByText('my note content')).toBeInTheDocument();
  });

  test('renders note with linked highlight', async () => {
    mockResponse('getNotes', [mockNoteLinked]);
    useHighlightsStore.setState({ byModule: { 'math:01': [mockHighlight] } });
    const { findByText } = render(<NotesHighlightsTab />);
    expect(await findByText('linked note')).toBeInTheDocument();
  });

  test('adds note when save clicked', async () => {
    mockResponse('getNotes', []);
    mockResponse('getHighlights', []);
    const created = { ...mockNote, id: 'n-new', content: 'new test note' };
    mockResponse('addNote', created);
    const { container, findByText } = render(<NotesHighlightsTab />);
    const textarea = await waitFor(() => container.querySelector('textarea')!);
    await user.type(textarea, 'new test note');
    await user.click(await findByText('Save Note'));
    await waitFor(() => {
      const notes = useNotesStore.getState().byModule['math:01'] ?? [];
      expect(notes.some((n) => n.content === 'new test note')).toBe(true);
    });
  });

  test('save note button disabled when textarea empty', async () => {
    mockResponse('getNotes', []);
    mockResponse('getHighlights', []);
    const { getByText } = render(<NotesHighlightsTab />);
    await waitFor(() => {
      expect(useNotesStore.getState().loading['math:01']).toBe(false);
    });
    expect(getByText('Save Note')).toBeDisabled();
  });

  test('deletes highlight', async () => {
    mockResponse('getNotes', []);
    useHighlightsStore.setState({ byModule: { 'math:01': [mockHighlight] } });
    mockResponse('deleteHighlight', undefined);
    const { findByText, getByText } = render(<NotesHighlightsTab />);
    expect(await findByText('important concept')).toBeInTheDocument();
    await user.click(getByText('Delete'));
    await waitFor(() => {
      expect(useHighlightsStore.getState().byModule['math:01'] ?? []).toHaveLength(0);
    });
  });

  test('deletes note', async () => {
    mockResponse('getNotes', [mockNote]);
    mockResponse('getHighlights', []);
    mockResponse('deleteNote', undefined);
    const { findByText, getByText } = render(<NotesHighlightsTab />);
    expect(await findByText('my note content')).toBeInTheDocument();
    await user.click(getByText('Delete'));
    await waitFor(() => {
      expect(useNotesStore.getState().byModule['math:01'] ?? []).toHaveLength(0);
    });
  });

  test('edits a note', async () => {
    mockResponse('getNotes', [mockNote]);
    mockResponse('getHighlights', []);
    const { findByText, getByText, container } = render(<NotesHighlightsTab />);
    expect(await findByText('my note content')).toBeInTheDocument();
    await user.click(getByText('Edit'));
    const textareas = container.querySelectorAll('textarea');
    expect(textareas[1]).toHaveValue('my note content');
    expect(getByText('Cancel')).toBeInTheDocument();
    await user.click(getByText('Cancel'));
    expect(getByText('Edit')).toBeInTheDocument();
  });

  test('save edit updates note', async () => {
    mockResponse('getNotes', [mockNote]);
    mockResponse('getHighlights', []);
    mockResponse('updateNote', undefined);
    const { findByText, container } = render(<NotesHighlightsTab />);
    expect(await findByText('my note content')).toBeInTheDocument();
    await user.click(await findByText('Edit'));
    const textareas = container.querySelectorAll('textarea');
    await user.clear(textareas[1]);
    await user.type(textareas[1], 'updated content');
    await user.click(await findByText('Save'));
    await waitFor(() => {
      const notes = useNotesStore.getState().byModule['math:01'] ?? [];
      expect(notes.some((n) => n.content === 'updated content')).toBe(true);
    });
  });
});
