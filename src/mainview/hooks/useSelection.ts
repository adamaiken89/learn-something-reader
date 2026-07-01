import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import type { TextSelection } from '../stores/selectionStore';
import { useSelectionStore } from '../stores/selectionStore';

export type { TextSelection };

export function useSelection(scrollContainerRef?: RefObject<HTMLElement | null>) {
  const rafRef = useRef<number>(0);
  const hideRafRef = useRef<number>(0);

  const showToolbar = useSelectionStore((s) => s.showToolbar);
  const showNoteEditor = useSelectionStore((s) => s.showNoteEditor);
  const showCardEditor = useSelectionStore((s) => s.showCardEditor);
  const noteText = useSelectionStore((s) => s.noteText);
  const selection = useSelectionStore((s) => s.selection);
  const pickerPos = useSelectionStore((s) => s.pickerPos);
  const selectedHighlightId = useSelectionStore((s) => s.selectedHighlightId);

  const handleTextSelection = useSelectionStore((s) => s.handleTextSelection);
  const setSelectedHighlight = useSelectionStore((s) => s.setSelectedHighlight);
  const openNoteEditor = useSelectionStore((s) => s.openNoteEditor);
  const openCardEditor = useSelectionStore((s) => s.openCardEditor);
  const setNoteText = useSelectionStore((s) => s.setNoteText);
  const closeToolbar = useSelectionStore((s) => s.closeToolbar);
  const closeNoteEditor = useSelectionStore((s) => s.closeNoteEditor);
  const closeCardEditor = useSelectionStore((s) => s.closeCardEditor);
  const updatePickerPos = useSelectionStore((s) => s.updatePickerPos);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        cancelAnimationFrame(hideRafRef.current);
        hideRafRef.current = requestAnimationFrame(() => {
          const sel2 = window.getSelection();
          if (!sel2 || sel2.isCollapsed || !sel2.rangeCount) {
            useSelectionStore.getState().resetSelection();
          }
        });
        return;
      }
      cancelAnimationFrame(hideRafRef.current);
      const range = sel.getRangeAt(0);
      const container = scrollContainerRef?.current;
      if (!container) return;
      if (!container.contains(range.commonAncestorContainer)) return;
      useSelectionStore.getState().handleTextSelection();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      cancelAnimationFrame(hideRafRef.current);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el || !selection) return;
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        useSelectionStore.getState().updatePickerPos();
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('scroll', onScroll);
    };
  }, [selection, scrollContainerRef]);

  return useMemo(
    () => ({
      showToolbar,
      showNoteEditor,
      showCardEditor,
      noteText,
      selection,
      pickerPos,
      selectedHighlightId,
      handleTextSelection,
      setSelectedHighlight,
      openNoteEditor,
      openCardEditor,
      setNoteText,
      closeToolbar,
      closeNoteEditor,
      closeCardEditor,
      updatePickerPos,
    }),
    [
      showToolbar,
      showNoteEditor,
      showCardEditor,
      noteText,
      selection,
      pickerPos,
      selectedHighlightId,
      handleTextSelection,
      setSelectedHighlight,
      openNoteEditor,
      openCardEditor,
      setNoteText,
      closeToolbar,
      closeNoteEditor,
      closeCardEditor,
      updatePickerPos,
    ],
  );
}
