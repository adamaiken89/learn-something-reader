import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useSelectionStore } from '../stores/selectionStore';

export function useSelection(scrollContainerRef?: RefObject<HTMLElement | null>) {
  const rafRef = useRef<number>(0);
  const hideRafRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);

  const actions = useSelectionStore(
    useShallow((s) => ({
      showToolbar: s.showToolbar,
      showNoteEditor: s.showNoteEditor,
      noteText: s.noteText,
      selection: s.selection,
      pickerPos: s.pickerPos,
      selectedHighlightId: s.selectedHighlightId,
      handleTextSelection: s.handleTextSelection,
      setSelectedHighlight: s.setSelectedHighlight,
      openNoteEditor: s.openNoteEditor,
      setNoteText: s.setNoteText,
      closeToolbar: s.closeToolbar,
      closeNoteEditor: s.closeNoteEditor,
      updatePickerPos: s.updatePickerPos,
    })),
  );

  useEffect(() => {
    const onMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const container = scrollContainerRef?.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;
      useSelectionStore.getState().handleTextSelection();
    };

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        cancelAnimationFrame(hideRafRef.current);
        hideRafRef.current = requestAnimationFrame(() => {
          const sel2 = window.getSelection();
          if (!sel2 || sel2.isCollapsed || !sel2.rangeCount) {
            const active = document.activeElement;
            if (
              active &&
              (active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'SELECT' ||
                (active as HTMLElement).isContentEditable)
            )
              return;
            const toolbar = document.querySelector('[data-testid="selection-toolbar"]');
            if (toolbar?.contains(active)) return;
            const st = useSelectionStore.getState();
            if (st.showNoteEditor) return;
            st.resetSelection();
          }
        });
        return;
      }

      if (isMouseDownRef.current) return;

      cancelAnimationFrame(hideRafRef.current);
      const range = sel.getRangeAt(0);
      const container = scrollContainerRef?.current;
      if (!container) return;
      if (!container.contains(range.commonAncestorContainer)) return;
      useSelectionStore.getState().handleTextSelection();
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      cancelAnimationFrame(hideRafRef.current);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el || !actions.selection) return;
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
  }, [actions.selection, scrollContainerRef]);

  return actions;
}
