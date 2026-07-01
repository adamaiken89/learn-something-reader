import { beforeEach, describe, expect, test } from 'bun:test';

import { useLessonUIStore } from './lessonUIStore';
import { useSelectionStore } from './selectionStore';

beforeEach(() => {
  useLessonUIStore.setState({ showTools: false, showPomodoro: false, searchCourseOpen: false });
  useSelectionStore.setState({
    showToolbar: false,
    showNoteEditor: false,
    showCardEditor: false,
    noteText: '',
    selection: null,
    pickerPos: { x: 0, y: 0, selectionTop: 0 },
    selectedHighlightId: null,
    popoverNote: null,
  });
});

describe('lessonUIStore', () => {
  test('default state', () => {
    const s = useLessonUIStore.getState();
    expect(s.showTools).toBe(false);
    expect(s.showPomodoro).toBe(false);
    expect(s.searchCourseOpen).toBe(false);
  });

  test('toggleTools flips showTools', () => {
    useLessonUIStore.getState().toggleTools();
    expect(useLessonUIStore.getState().showTools).toBe(true);
    useLessonUIStore.getState().toggleTools();
    expect(useLessonUIStore.getState().showTools).toBe(false);
  });

  test('togglePomodoro flips showPomodoro', () => {
    useLessonUIStore.getState().togglePomodoro();
    expect(useLessonUIStore.getState().showPomodoro).toBe(true);
    useLessonUIStore.getState().togglePomodoro();
    expect(useLessonUIStore.getState().showPomodoro).toBe(false);
  });

  test('setSearchCourseOpen sets to true', () => {
    useLessonUIStore.getState().setSearchCourseOpen(true);
    expect(useLessonUIStore.getState().searchCourseOpen).toBe(true);
  });

  test('setSearchCourseOpen sets to false', () => {
    useLessonUIStore.getState().setSearchCourseOpen(true);
    useLessonUIStore.getState().setSearchCourseOpen(false);
    expect(useLessonUIStore.getState().searchCourseOpen).toBe(false);
  });
});

describe('selectionStore', () => {
  test('default state', () => {
    const s = useSelectionStore.getState();
    expect(s.showToolbar).toBe(false);
    expect(s.showNoteEditor).toBe(false);
    expect(s.showCardEditor).toBe(false);
    expect(s.noteText).toBe('');
    expect(s.selection).toBeNull();
    expect(s.selectedHighlightId).toBeNull();
    expect(s.popoverNote).toBeNull();
  });

  test('openNoteEditor shows editor and clears text', () => {
    useSelectionStore.getState().setNoteText('old');
    useSelectionStore.getState().openNoteEditor();
    expect(useSelectionStore.getState().showNoteEditor).toBe(true);
    expect(useSelectionStore.getState().noteText).toBe('');
  });

  test('closeNoteEditor hides editor', () => {
    useSelectionStore.getState().openNoteEditor();
    useSelectionStore.getState().closeNoteEditor();
    expect(useSelectionStore.getState().showNoteEditor).toBe(false);
  });

  test('openCardEditor shows card editor', () => {
    useSelectionStore.getState().openCardEditor();
    expect(useSelectionStore.getState().showCardEditor).toBe(true);
  });

  test('closeCardEditor hides card editor', () => {
    useSelectionStore.getState().openCardEditor();
    useSelectionStore.getState().closeCardEditor();
    expect(useSelectionStore.getState().showCardEditor).toBe(false);
  });

  test('setSelectedHighlight updates id', () => {
    useSelectionStore.getState().setSelectedHighlight('h-1');
    expect(useSelectionStore.getState().selectedHighlightId).toBe('h-1');
    useSelectionStore.getState().setSelectedHighlight(null);
    expect(useSelectionStore.getState().selectedHighlightId).toBeNull();
  });

  test('setPopoverNote sets note', () => {
    const note = {
      note: {
        id: 'n1',
        courseID: 'c1',
        moduleID: 'm1',
        highlightID: null,
        sectionID: null,
        content: '',
        createdAt: '',
        updatedAt: '',
      },
      x: 10,
      y: 20,
    };
    useSelectionStore.getState().setPopoverNote(note);
    expect(useSelectionStore.getState().popoverNote).toEqual(note);
  });

  test('closeToolbar clears selection', () => {
    useSelectionStore.setState({
      showToolbar: true,
      selection: { text: 'text', range: {} as Range },
      selectedHighlightId: 'h-1',
    });
    useSelectionStore.getState().closeToolbar();
    const s = useSelectionStore.getState();
    expect(s.showToolbar).toBe(false);
    expect(s.selection).toBeNull();
    expect(s.selectedHighlightId).toBeNull();
  });
});
