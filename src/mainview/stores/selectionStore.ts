import { create } from 'zustand';

import type { Note } from '../../bun/types';

interface TextSelection {
  text: string;
  range: Range;
}

interface SelectionState {
  showToolbar: boolean;
  showNoteEditor: boolean;
  noteText: string;
  selection: TextSelection | null;
  pickerPos: { x: number; y: number; selectionTop: number };
  selectedHighlightId: string | null;
  popoverNote: { note: Note; x: number; y: number } | null;
  handleTextSelection: () => void;
  updatePickerPos: () => void;
  setSelectedHighlight: (id: string | null) => void;
  openNoteEditor: () => void;
  setNoteText: (text: string) => void;
  closeToolbar: () => void;
  closeNoteEditor: () => void;
  resetSelection: () => void;
  setPopoverNote: (note: { note: Note; x: number; y: number } | null) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  showToolbar: false,
  showNoteEditor: false,
  noteText: '',
  selection: null,
  pickerPos: { x: 0, y: 0, selectionTop: 0 },
  selectedHighlightId: null,
  popoverNote: null,

  handleTextSelection: () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      set({ showToolbar: false, selection: null });
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length < 3 || text.length > 500) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    set({
      selection: { text, range },
      pickerPos: { x: rect.left + rect.width / 2, y: rect.bottom, selectionTop: rect.top },
      showToolbar: true,
    });
  },

  updatePickerPos: () => {
    const { selection } = get();
    if (!selection) return;
    try {
      const rect = selection.range.getBoundingClientRect();
      set({
        pickerPos: { x: rect.left + rect.width / 2, y: rect.bottom, selectionTop: rect.top },
      });
    } catch {
      /* range invalid */
    }
  },

  setSelectedHighlight: (id) => set({ selectedHighlightId: id }),

  setPopoverNote: (note) => set({ popoverNote: note }),

  openNoteEditor: () =>
    set((state) => ({
      showNoteEditor: !state.showNoteEditor,
      noteText: '',
    })),

  setNoteText: (text) => set({ noteText: text }),

  closeToolbar: () => {
    set({ showToolbar: false, selection: null, selectedHighlightId: null });
    window.getSelection()?.removeAllRanges();
  },

  closeNoteEditor: () =>
    set({ showNoteEditor: false, noteText: '', showToolbar: false, selection: null }),

  resetSelection: () => set({ showToolbar: false, selection: null }),
}));
