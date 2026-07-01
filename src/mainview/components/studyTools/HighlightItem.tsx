import { useTranslation } from 'react-i18next';

import type { Highlight, Section } from '../../../bun/types';
import { findSectionIdForHighlight } from './notesHelpers';

interface HighlightItemProps {
  highlight: Highlight;
  contentRef: React.RefObject<HTMLDivElement | null>;
  sections: Section[];
  onDelete: (id: string) => void | Promise<void>;
}

export default function HighlightItem({
  highlight,
  contentRef,
  sections,
  onDelete,
}: HighlightItemProps) {
  const { t } = useTranslation();
  const sec = findSectionIdForHighlight(contentRef, highlight.id, sections);

  return (
    <>
      <p className="text-xs text-gray-300 line-clamp-2">{highlight.selectedText}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: highlight.color }} />
        <span className="text-[10px] text-gray-500">
          {highlight.startOffset}–{highlight.endOffset}
        </span>
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
