import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { Section } from '../../../bun/types';
import { logger } from '../../logger';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { toggleVariants } from '../ui';
import SectionRow from './SectionRow';

interface SectionsPanelProps {
  sections: Section[];
  courseId: string;
  moduleId: string;
  moduleName: string;
  hasPrev: boolean;
  hasNext: boolean;
  onGoPrev: () => void;
  onGoNext: () => void;
  onScrollToSection: (sectionId: string) => void;
  onClose: () => void;
}

export default function SectionsPanel({
  sections,
  courseId,
  moduleId,
  moduleName,
  hasPrev,
  hasNext,
  onGoPrev,
  onGoNext,
  onScrollToSection,
  onClose,
}: SectionsPanelProps) {
  const { t } = useTranslation();
  const sectionsRef = useRef<HTMLDivElement>(null);

  const visibleSection = useLessonUIStore((s) => s.visibleSection);
  const bookmarks = useBookmarksStore((s) => s.byModule[`${courseId}:${moduleId}`]) ?? [];

  useEffect(() => {
    if (!visibleSection || !sectionsRef.current) return;
    const el = sectionsRef.current.querySelector(`[data-section-id="${visibleSection}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [visibleSection]);

  const handleToggleSectionBookmark = (sectionId: string, heading: string) => {
    const { toggle } = useBookmarksStore.getState();
    void toggle(courseId, moduleId, `${moduleName} – ${heading}`, sectionId);
  };

  return (
    <div
      data-testid="sections-panel"
      className="w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col max-h-[70vh]"
    >
      {sections.length > 0 && (
        <>
          <div className="shrink-0 px-2.5 py-1.5 border-b border-gray-700 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-indigo-400 shrink-0">
              {t('lesson.sections')}
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] text-gray-500 shrink-0">{sections.length}</span>
              <button onClick={onClose} className={toggleVariants({ active: true })}>
                →
              </button>
            </div>
          </div>
          <div className="shrink-0 flex border-b border-gray-700">
            <button
              onClick={onGoPrev}
              disabled={!hasPrev}
              className={`flex-1 text-xs py-0.5 transition-colors ${
                hasPrev
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title={t('lesson.prevModule')}
            >
              ◀
            </button>
            <button
              onClick={onGoNext}
              disabled={!hasNext}
              className={`flex-1 text-xs py-0.5 transition-colors ${
                hasNext
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title={t('lesson.nextModule')}
            >
              ▶
            </button>
          </div>
          <div className="overflow-y-auto" ref={sectionsRef}>
            {sections.map((s) => (
              <SectionRow
                key={s.id}
                section={s}
                isActive={s.id === visibleSection}
                isBookmarked={bookmarks.some((b) => b.sectionID === s.id)}
                onScrollTo={() => {
                  logger.debug(
                    { sectionId: s.id, heading: s.heading },
                    'SectionsPanel: section clicked',
                  );
                  onScrollToSection(s.id);
                }}
                onToggleBookmark={() => handleToggleSectionBookmark(s.id, s.heading)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
