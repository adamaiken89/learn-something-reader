import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ModuleMeta, Section } from '../../../bun/types';
import { logger } from '../../logger';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useCompletionStore } from '../../stores/completionStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { toggleVariants } from '../ui';
import SectionRow from './SectionRow';

interface NavigationPanelProps {
  sections: Section[];
  courseId: string;
  moduleId: string;
  moduleName: string;
  modules: ModuleMeta[];
  currentModuleId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onGoPrev: () => void;
  onGoNext: () => void;
  onScrollToSection: (sectionId: string) => void;
  onModuleSelect: (mod: ModuleMeta) => void;
  onClose: () => void;
}

export default function NavigationPanel({
  sections,
  courseId,
  moduleId,
  moduleName,
  modules,
  currentModuleId,
  hasPrev,
  hasNext,
  onGoPrev,
  onGoNext,
  onScrollToSection,
  onModuleSelect,
  onClose,
}: NavigationPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'sections' | 'modules'>('sections');
  const sectionsRef = useRef<HTMLDivElement>(null);

  const visibleSection = useLessonUIStore((s) => s.visibleSection);
  const bookmarks = useBookmarksStore((s) => s.byModule[`${courseId}:${moduleId}`]) ?? [];
  const completed = useCompletionStore((s) => s.completed);

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
      data-testid="navigation-panel"
      className="w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col max-h-[70vh]"
    >
      <div className="shrink-0 px-2.5 py-1.5 border-b border-gray-700 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('sections')}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              activeTab === 'sections'
                ? 'bg-indigo-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('lesson.sections')}
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              activeTab === 'modules'
                ? 'bg-indigo-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('lesson.modules')}
          </button>
        </div>
        <button onClick={onClose} className={toggleVariants({ active: true })}>
          →
        </button>
      </div>

      {activeTab === 'sections' && (
        <>
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
          {sections.length > 0 ? (
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
                      'NavigationPanel: section clicked',
                    );
                    onScrollToSection(s.id);
                  }}
                  onToggleBookmark={() => handleToggleSectionBookmark(s.id, s.heading)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">{t('lesson.noSections')}</div>
          )}
        </>
      )}

      {activeTab === 'modules' && (
        <div className="overflow-y-auto">
          {modules.map((mod, i) => {
            const isCurrent = mod.id === currentModuleId;
            const isCompleted = completed[`${courseId}:${mod.id}`] ?? false;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  if (!isCurrent) onModuleSelect(mod);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-indigo-900/30 text-indigo-300'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="shrink-0 w-5 text-center">
                  {isCompleted ? t('icons.check') : String(i + 1)}
                </span>
                <span className="truncate">{mod.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
