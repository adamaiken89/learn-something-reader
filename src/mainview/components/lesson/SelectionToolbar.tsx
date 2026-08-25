import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import BottomSheet from '@/components/shadcn/bottom-sheet';
import { Button } from '@/components/shadcn/button';

import { useFloatingPosition } from '../../hooks/useFloatingPosition';
import { useIsMobile } from '../../hooks/useIsMobile';
import { getTextOffset } from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { ColorPickerRow } from './ColorPickerRow';
import NoteEditor from './NoteEditor';

export default function SelectionToolbar() {
  const { t } = useTranslation();

  const store = useSelectionStore(
    useShallow((s) => ({
      showToolbar: s.showToolbar,
      selection: s.selection,
      pickerPos: s.pickerPos,
      selectedHighlightId: s.selectedHighlightId,
      showNoteEditor: s.showNoteEditor,
      openNoteEditor: s.openNoteEditor,
    })),
  );
  const closeToolbar = useSelectionStore((s) => s.closeToolbar);
  const isMobile = useIsMobile();
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const contentRef = useLessonViewStore((s) => s.contentRef);
  const markdownRef = useLessonViewStore((s) => s.markdownRef);

  const highlights =
    useHighlightsStore((s) => {
      if (!courseId || !moduleId) return undefined;
      return s.byModule[`${courseId}:${moduleId}`];
    }) ?? [];

  const handleAddHighlight = async (color: string) => {
    const sel = useSelectionStore.getState().selection;
    if (!sel) return;
    const root = markdownRef.current ?? contentRef.current;
    if (!root) return;
    const offsets = getTextOffset(root, sel.range);
    if (!offsets) return;
    await useHighlightsStore
      .getState()
      .add(courseId, moduleId, sel.text, color, offsets.start, offsets.end);
    void navigator.clipboard.writeText(sel.text);
    setTimeout(() => closeToolbar(), 700);
    requestAnimationFrame(() => {
      const marks = contentRef.current?.querySelectorAll('mark');
      marks?.forEach((mark) => {
        if (mark.textContent?.trim() === sel.text.trim() && !mark.dataset.flashApplied) {
          mark.dataset.flashApplied = 'true';
          mark.classList.add('anim-highlight-flash');
          setTimeout(() => mark.classList.remove('anim-highlight-flash'), 600);
        }
      });
    });
  };

  const handleDelete = () => {
    const id = useSelectionStore.getState().selectedHighlightId;
    if (id) {
      void useHighlightsStore.getState().remove(id);
      closeToolbar();
    }
  };

  const { menuRef, position } = useFloatingPosition(
    store.pickerPos.x,
    store.pickerPos.y,
    store.pickerPos.selectionTop,
  );

  if (!store.showToolbar || !store.selection) return null;

  const activeHighlightColor = (() => {
    if (!highlights.length) return undefined;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return undefined;
    const range = sel.getRangeAt(0);
    const found = highlights.find((h) => range.toString() === h.selectedText);
    return found?.color;
  })();

  const toolbarContent = (
    <div className="anim-selection-toolbar-enter">
      <ColorPickerRow
        activeHighlightColor={activeHighlightColor}
        onSelectColor={(color) => {
          void handleAddHighlight(color);
        }}
        onDeleteHighlight={handleDelete}
      />

      <div className="h-px bg-gray-700/50 mx-2 my-1" />

      <Button variant="ghost" size="md" onClick={store.openNoteEditor} className="justify-start">
        <Pencil size={16} className="text-gray-400 shrink-0" />
        <span className="truncate">{t('lesson.addNote')}</span>
      </Button>

      {store.showNoteEditor && <NoteEditor />}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={store.showToolbar} onClose={closeToolbar}>
        {toolbarContent}
      </BottomSheet>
    );
  }

  return (
    <div
      ref={menuRef}
      data-testid="selection-toolbar"
      className="fixed z-50 bg-gray-900/80 backdrop-blur-md border border-gray-800/80 rounded-xl shadow-2xl py-2 px-1 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
    >
      {toolbarContent}
    </div>
  );
}
