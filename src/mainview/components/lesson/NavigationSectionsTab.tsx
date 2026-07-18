import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { headingId } from '../../../bun/lessonMarkdown';
import type { ModuleMeta, ModuleSession, Section } from '../../../bun/types';
import { api } from '../../api';
import { logger } from '../../logger';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { useCompletionStore } from '../../stores/completionStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import SectionRow from './SectionRow';

interface Props {
  courseId: string;
  moduleId: string;
  moduleName: string;
  modules: ModuleMeta[];
  onScrollToSection: (sectionId: string) => void;
  onModuleSelect: (mod: ModuleMeta, sectionID?: string) => void;
}

export default function NavigationSectionsTab({
  courseId,
  moduleId,
  moduleName,
  modules,
  onScrollToSection,
  onModuleSelect,
}: Props) {
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [collapseCurrent, setCollapseCurrent] = useState(false);
  const [allSections, setAllSections] = useState<Record<string, Section[]>>({});
  const [moduleSessions, setModuleSessions] = useState<Record<string, ModuleSession>>({});
  const sectionsRef = useRef<HTMLDivElement>(null);
  const activeModRef = useRef<HTMLButtonElement>(null);

  const visibleSection = useLessonUIStore((s) => s.visibleSection);
  const bookmarks = useBookmarksStore((s) => s.byModule[`${courseId}:${moduleId}`]) ?? [];
  const completed = useCompletionStore((s) => s.completed);

  useEffect(() => {
    const load = async () => {
      const [entries, sessions] = await Promise.all([
        Promise.all(modules.map((mod) => api.courses.sections(courseId, mod.id))),
        api.session.getCourseModuleSessions(courseId),
      ]);
      const sectionEntries = modules.map((mod, i) => [mod.id, entries[i]] as const);
      setAllSections(Object.fromEntries(sectionEntries));
      const sessionMap: Record<string, ModuleSession> = {};
      for (const s of sessions) {
        sessionMap[`${courseId}:${s.moduleId}`] = s;
      }
      setModuleSessions(sessionMap);
    };
    void load();
  }, [courseId, modules]);

  useEffect(() => {
    setCollapseCurrent(false);
    setExpandedModules((prev) => {
      if (prev.has(moduleId)) return prev;
      return new Set(prev).add(moduleId);
    });
  }, [moduleId]);

  useEffect(() => {
    activeModRef.current?.scrollIntoView({ block: 'nearest' });
  }, [moduleId]);

  const toggleExpand = (modId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

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
    <div className="overflow-y-auto flex-1" ref={sectionsRef}>
      {modules.map((mod) => {
        const isCurrent = mod.id === moduleId;
        const isExpanded = isCurrent ? !collapseCurrent : expandedModules.has(mod.id);
        const isCompleted = completed[`${courseId}:${mod.id}`] ?? false;
        const modSections = allSections[mod.id] ?? [];
        const displaySections = modSections.filter(
          (s) => s.level > 1 && !['Drill', 'Feynman Explain', 'Reframe'].includes(s.heading),
        );
        return (
          <div key={mod.id}>
            <button
              ref={isCurrent ? activeModRef : undefined}
              onClick={() => {
                if (!isCurrent) {
                  const s = moduleSessions[`${courseId}:${mod.id}`];
                  onModuleSelect(mod, s?.sectionId ?? undefined);
                  toggleExpand(mod.id);
                  return;
                }
                onScrollToSection(headingId(mod.name));
                setCollapseCurrent(true);
              }}
              title={mod.name}
              className={`w-full text-left px-2 py-1.5 text-xs transition-colors flex items-start ${
                isCurrent
                  ? 'bg-indigo-900/30 text-indigo-300'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="shrink-0 flex items-center pt-px">
                <span className="w-5 text-right text-[10px] tabular-nums text-gray-500">
                  {modules.indexOf(mod) + 1}
                </span>
                {isCompleted && <Check size={12} className="text-green-400 shrink-0" />}
                {!isCompleted && moduleSessions[`${courseId}:${mod.id}`] && (
                  <span title={t('lesson.prevRead')}>
                    <Circle size={8} className="text-gray-500 fill-gray-500 shrink-0" />
                  </span>
                )}
                <span className="w-3 flex justify-center text-gray-500">
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
              </span>
              <span className="flex-1 min-w-0 whitespace-normal leading-snug text-xs">
                {mod.name}
              </span>
            </button>
            {isExpanded && displaySections.length > 0 && (
              <div>
                {displaySections.map((s) => (
                  <SectionRow
                    key={s.id}
                    section={s}
                    isActive={s.id === visibleSection}
                    isBookmarked={bookmarks.some((b) => b.sectionID === s.id)}
                    onScrollTo={() => {
                      logger.debug(
                        { sectionId: s.id, heading: s.heading },
                        'NavigationSectionsTab: section clicked',
                      );
                      onScrollToSection(s.id);
                    }}
                    onToggleBookmark={() => handleToggleSectionBookmark(s.id, s.heading)}
                  />
                ))}
              </div>
            )}
            {isExpanded && displaySections.length === 0 && isCurrent && (
              <div className="p-4 text-center text-xs text-gray-500">{t('lesson.noSections')}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
