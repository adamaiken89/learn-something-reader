import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { api } from '../../api';
import { useFloatingPosition } from '../../hooks/useFloatingPosition';
import { getTextOffset } from '../../sections/lessonHelpers';
import { useHighlightsStore } from '../../stores/highlightsStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';

export default function NoteEditor() {
  const { t } = useTranslation();

  const store = useSelectionStore(
    useShallow((s) => ({
      selection: s.selection,
      pickerPos: s.pickerPos,
      showNoteEditor: s.showNoteEditor,
      noteText: s.noteText,
      setNoteText: s.setNoteText,
      closeToolbar: s.closeToolbar,
      closeNoteEditor: s.closeNoteEditor,
    })),
  );
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);
  const contentRef = useLessonViewStore((s) => s.contentRef);

  const selectedText = store.selection?.text ?? '';
  const editorY = store.pickerPos.y - 120;
  const { menuRef, position } = useFloatingPosition(store.pickerPos.x, editorY, editorY);

  if (!store.showNoteEditor || !store.selection) return null;

  return (
    <div
      ref={menuRef}
      data-testid="note-editor"
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, 0)', width: '280px' }}
    >
      <p className="text-[10px] text-gray-500 mb-1.5 truncate">
        &ldquo;{selectedText.slice(0, 80)}
        {selectedText.length > 80 ? '...' : ''}&rdquo;
      </p>
      <textarea
        value={store.noteText}
        onChange={(e) => store.setNoteText(e.target.value)}
        placeholder={t('studyTools.addNote')}
        className="w-full bg-gray-700 border border-gray-600 rounded text-xs p-2 text-gray-200 placeholder-gray-500 resize-none h-16 focus:outline-none focus:border-indigo-500"
        autoFocus
      />
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => {
            const sel = useSelectionStore.getState().selection;
            const nt = useSelectionStore.getState().noteText;
            if (!sel || !nt.trim()) return;
            const el = contentRef.current;
            const offsets = el ? getTextOffset(el, sel.range) : null;
            if (!offsets) return;
            void api.storage.addAnnotation({
              courseID: courseId,
              moduleID: moduleId,
              selectedText: sel.text,
              startOffset: offsets.start,
              endOffset: offsets.end,
              color: 'note',
              noteContent: nt.trim(),
            });
            store.closeToolbar();
            store.closeNoteEditor();
            void useHighlightsStore.getState().load(courseId, moduleId);
          }}
          disabled={!store.noteText.trim()}
          className="flex-1 py-1 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40"
        >
          {t('studyTools.saveNote')}
        </button>
        <button
          onClick={store.closeNoteEditor}
          className="py-1 text-[10px] text-gray-400 hover:text-gray-200"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
