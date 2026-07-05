import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useFloatingPosition } from '../../hooks/useFloatingPosition';
import { getTextOffset } from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { Button } from '../ui';
import CardEditor from './CardEditor';
import { ColorPickerRow } from './ColorPickerRow';
import NoteEditor from './NoteEditor';

export default function SelectionToolbar() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const store = useSelectionStore(
    useShallow((s) => ({
      showToolbar: s.showToolbar,
      selection: s.selection,
      pickerPos: s.pickerPos,
      selectedHighlightId: s.selectedHighlightId,
      showNoteEditor: s.showNoteEditor,
      showCardEditor: s.showCardEditor,
      openNoteEditor: s.openNoteEditor,
      openCardEditor: s.openCardEditor,
    })),
  );
  const closeToolbar = useSelectionStore((s) => s.closeToolbar);
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const contentRef = useLessonViewStore((s) => s.contentRef);

  const highlights =
    useHighlightsStore((s) => {
      if (!courseId || !moduleId) return undefined;
      return s.byModule[`${courseId}:${moduleId}`];
    }) ?? [];

  const selectedText = store.selection?.text ?? '';

  const handleAddHighlight = useCallback(
    async (color: string) => {
      const sel = useSelectionStore.getState().selection;
      if (!sel || !contentRef.current) return;
      const offsets = getTextOffset(contentRef.current, sel.range);
      if (!offsets) return;
      await useHighlightsStore
        .getState()
        .add(courseId, moduleId, sel.text, color, offsets.start, offsets.end);
      closeToolbar();
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
    },
    [contentRef, courseId, moduleId, closeToolbar],
  );

  const handleDelete = useCallback(() => {
    const id = useSelectionStore.getState().selectedHighlightId;
    if (id) {
      void useHighlightsStore.getState().remove(id);
      closeToolbar();
    }
  }, [closeToolbar]);

  const { menuRef, position } = useFloatingPosition(
    store.pickerPos.x,
    store.pickerPos.y,
    store.pickerPos.selectionTop,
  );

  const handleCopy = () => {
    if (!selectedText) return;
    void navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 700);
  };

  if (!store.showToolbar || !store.selection) return null;

  const activeHighlightColor = (() => {
    if (!highlights.length) return undefined;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return undefined;
    const range = sel.getRangeAt(0);
    const found = highlights.find((h) => range.toString() === h.selectedText);
    return found?.color;
  })();

  return (
    <div
      ref={menuRef}
      data-testid="selection-toolbar"
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px]"
      style={{ left: position.x, top: position.y, transform: 'translateX(-50%)' }}
    >
      <ColorPickerRow
        activeHighlightColor={activeHighlightColor}
        onSelectColor={(color) => {
          void handleAddHighlight(color);
        }}
        onDeleteHighlight={handleDelete}
      />

      <div className="h-px bg-gray-600 my-0.5" />

      <Button variant="ghost" size="md" onClick={store.openNoteEditor} className="justify-start">
        <span className="shrink-0">{t('icons.note')}</span>
        <span className="truncate">{t('lesson.addNote')}</span>
      </Button>

      <Button variant="ghost" size="md" onClick={store.openCardEditor} className="justify-start">
        <span className="shrink-0">{t('icons.cards')}</span>
        <span className="truncate">{t('lesson.createCard')}</span>
      </Button>

      <Button variant="ghost" size="md" onClick={handleCopy} className="justify-start">
        <span className="shrink-0">{t('icons.clipboard')}</span>
        <span className="truncate">{copied ? t('selection.copied') : t('lesson.copy')}</span>
      </Button>

      {store.showNoteEditor && <NoteEditor />}
      {store.showCardEditor && <CardEditor />}
    </div>
  );
}
