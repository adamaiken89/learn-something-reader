import { beforeEach, describe, expect, test } from 'bun:test';

import { useSelectionStore } from './selectionStore';

const DEFAULTS = {
  showToolbar: false as boolean,
  showNoteEditor: false as boolean,
  noteText: '',
  selection: null,
  pickerPos: { x: 0, y: 0, selectionTop: 0 },
  selectedHighlightId: null,
};

beforeEach(() => {
  useSelectionStore.setState(DEFAULTS);
});

describe('selectionStore', () => {
  describe('openNoteEditor', () => {
    test('opens note editor', () => {
      useSelectionStore.getState().openNoteEditor();
      const s = useSelectionStore.getState();
      expect(s.showNoteEditor).toBe(true);
      expect(s.noteText).toBe('');
    });

    test('toggles off when note editor already open', () => {
      useSelectionStore.getState().openNoteEditor();
      expect(useSelectionStore.getState().showNoteEditor).toBe(true);
      useSelectionStore.getState().openNoteEditor();
      expect(useSelectionStore.getState().showNoteEditor).toBe(false);
    });
  });

  describe('closeNoteEditor', () => {
    test('closes note and toolbar, clears text', () => {
      useSelectionStore.setState({
        showToolbar: true,
        showNoteEditor: true,
        noteText: 'hi',
        selection: { text: 'hi', range: new Range() },
      });
      useSelectionStore.getState().closeNoteEditor();
      const s = useSelectionStore.getState();
      expect(s.showNoteEditor).toBe(false);
      expect(s.noteText).toBe('');
      expect(s.showToolbar).toBe(false);
      expect(s.selection).toBeNull();
    });
  });

  describe('resetSelection', () => {
    test('clears toolbar and selection, preserves editors', () => {
      useSelectionStore.setState({
        showToolbar: true,
        showNoteEditor: true,
        selection: { text: 'hi', range: new Range() },
      });
      useSelectionStore.getState().resetSelection();
      const s = useSelectionStore.getState();
      expect(s.showToolbar).toBe(false);
      expect(s.selection).toBeNull();
      expect(s.showNoteEditor).toBe(true);
    });
  });
});
