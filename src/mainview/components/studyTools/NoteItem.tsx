import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Highlight, Section } from '../../../bun/types';

interface NoteItemProps {
  note: {
    id: string;
    content: string;
    sectionID: string | null;
    highlightID: string | null;
    createdAt: string;
  };
  linkedHighlight?: Highlight;
  sections: Section[];
  onUpdate: (id: string, content: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export default function NoteItem({
  note,
  linkedHighlight,
  sections,
  onUpdate,
  onDelete,
}: NoteItemProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const handleSave = () => {
    if (!editContent.trim()) return;
    void onUpdate(note.id, editContent.trim());
    setEditing(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full border-2 border-red-500 bg-white shrink-0" />
        <span className="text-[10px] text-gray-400">{t('studyTools.notes')}</span>
      </div>
      {linkedHighlight && (
        <p className="text-[10px] text-gray-600 italic mb-1 truncate border-l-2 border-gray-600 pl-1.5">
          &ldquo;{linkedHighlight.selectedText.slice(0, 60)}
          {linkedHighlight.selectedText.length > 60 ? '...' : ''}&rdquo;
        </p>
      )}
      {editing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded text-xs p-1.5 text-gray-200 resize-none h-16 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-0.5 text-[10px] bg-indigo-700 hover:bg-indigo-600 rounded"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="py-0.5 text-[10px] text-gray-400 hover:text-gray-200"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-300 whitespace-pre-wrap">{note.content}</p>
          <div className="flex gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setEditing(true);
                setEditContent(note.content);
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={() => void onDelete(note.id)}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              {t('common.delete')}
            </button>
          </div>
        </>
      )}
      {note.sectionID && (
        <p className="text-[10px] text-gray-600 mt-1">
          {t('studyTools.section')}{' '}
          {sections.find((s) => s.id === note.sectionID)?.heading ?? note.sectionID}
        </p>
      )}
    </>
  );
}
