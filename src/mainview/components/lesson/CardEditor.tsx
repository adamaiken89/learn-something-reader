import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { api } from '../../api';
import { useFloatingPosition } from '../../hooks/useFloatingPosition';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useSelectionStore } from '../../stores/selectionStore';

export default function CardEditor() {
  const { t } = useTranslation();

  const store = useSelectionStore(
    useShallow((s) => ({
      selection: s.selection,
      pickerPos: s.pickerPos,
      showCardEditor: s.showCardEditor,
      closeCardEditor: s.closeCardEditor,
    })),
  );
  const courseId = useLessonViewStore((s) => s.courseId);
  const moduleId = useLessonViewStore((s) => s.moduleId);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const editorY = store.pickerPos.y - 120;
  const { menuRef, position } = useFloatingPosition(store.pickerPos.x, editorY, editorY);
  const prevShowRef = useRef(false);

  useEffect(() => {
    if (store.showCardEditor && !prevShowRef.current && store.selection) {
      setFront(store.selection.text);
      setBack('');
    }
    prevShowRef.current = store.showCardEditor;
  }, [store.showCardEditor, store.selection]);

  if (!store.showCardEditor || !store.selection) return null;

  return (
    <div
      ref={menuRef}
      data-testid="card-editor"
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, 0)', width: '300px' }}
    >
      <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wider">
        {t('lesson.createCard')}
      </p>
      <label className="text-[10px] text-gray-400 block mb-0.5">{t('userCardReview.front')}</label>
      <textarea
        value={front}
        onChange={(e) => setFront(e.target.value)}
        placeholder={t('studyTools.cardFront')}
        className="w-full bg-gray-700 border border-gray-600 rounded text-xs p-2 text-gray-200 placeholder-gray-500 resize-none h-16 focus:outline-none focus:border-indigo-500 mb-2"
        autoFocus
      />
      <label className="text-[10px] text-gray-400 block mb-0.5">{t('userCardReview.back')}</label>
      <textarea
        value={back}
        onChange={(e) => setBack(e.target.value)}
        placeholder={t('studyTools.cardBack')}
        className="w-full bg-gray-700 border border-gray-600 rounded text-xs p-2 text-gray-200 placeholder-gray-500 resize-none h-20 focus:outline-none focus:border-indigo-500"
      />
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => {
            if (!front.trim() || !back.trim()) return;
            void api.usercards.create(courseId, moduleId, front, back);
            store.closeCardEditor();
          }}
          disabled={!front.trim() || !back.trim()}
          className="flex-1 py-1 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-40"
        >
          {t('common.save')}
        </button>
        <button
          onClick={store.closeCardEditor}
          className="py-1 text-[10px] text-gray-400 hover:text-gray-200"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
