import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Highlight } from '../../../bun/types';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { findSectionIdForHighlight } from './notesHelpers';

const SNIPPET_MAX = 120;

interface HighlightItemProps {
  highlight: Highlight;
  onDelete: (id: string) => void | Promise<void>;
}

export default function HighlightItem({ highlight, onDelete }: HighlightItemProps) {
  const { t } = useTranslation();
  const { contentRef, sections } = useLessonViewStore();
  const all = useBookmarksStore((s) => s.all);
  const toggleHighlightSave = useBookmarksStore((s) => s.toggleHighlightSave);

  const storedSec = highlight.sectionID
    ? sections.find((s) => s.id === highlight.sectionID)
    : undefined;
  const sec = storedSec
    ? { id: storedSec.id, heading: storedSec.heading }
    : findSectionIdForHighlight(contentRef, highlight.id, sections);
  const snippet = highlight.selectedText.slice(0, SNIPPET_MAX);
  const saved = all.some(
    (b) =>
      b.kind === 'highlight' &&
      b.moduleID === highlight.moduleID &&
      b.courseID === highlight.courseID &&
      b.snippet === snippet,
  );

  return (
    <>
      <p className="text-xs text-gray-300 line-clamp-2">{highlight.selectedText}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: highlight.color }} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleHighlightSave(
              highlight.courseID,
              highlight.moduleID,
              snippet,
              storedSec?.id ?? sec?.id ?? null,
            );
          }}
          className={`text-[10px] flex items-center gap-1 hover:text-indigo-300 ${
            saved ? 'text-indigo-400' : 'text-gray-500'
          }`}
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {saved ? t('bookmarks.saved') : t('bookmarks.save')}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void onDelete(highlight.id);
          }}
          className="text-[10px] text-red-400 hover:text-red-300"
        >
          {t('common.delete')}
        </button>
      </div>
      {sec && (
        <p className="text-[10px] text-gray-600 mt-1">
          {t('studyTools.section')} {sec.heading}
        </p>
      )}
    </>
  );
}
