import { ListChecks, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import type { Course, ModuleMeta } from '../../bun/types';
import AppearancePopover from '../components/lesson/AppearancePopover';
import CardsButton from '../components/lesson/CardsButton';
import LessonToolbar from '../components/lesson/LessonToolbar';
import ProgressBadge from '../components/lesson/ProgressBadge';
import QuizReviewButtons from '../components/lesson/QuizReviewButtons';
import ShortcutHelp from '../components/lesson/ShortcutHelp';
import SearchOverlay from '../components/SearchOverlay';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLastSession } from '../hooks/useLastSession';
import { useLessonToolbarShortcuts } from '../hooks/useLessonToolbarShortcuts';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import LessonSection from '../sections/LessonSection';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';

interface LessonFeatureProps {
  course: Course;
  module: ModuleMeta;
  initialSectionID?: string;
  onBack: () => void;
}

export default function LessonPage({
  course,
  module,
  initialSectionID,
  onBack,
}: LessonFeatureProps) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const searchCourseOpen = useLessonUIStore((s) => s.searchCourseOpen);
  const setSearchCourseOpen = useLessonUIStore((s) => s.setSearchCourseOpen);
  const transitionStyle = useSettingsStore((s) => s.transitionStyle);
  const isMobile = useIsMobile();
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  const focusMode = useSettingsStore((s) => s.focusMode);
  useLessonToolbarShortcuts(course, module);
  useLastSession(course, module);

  const [animClass, setAnimClass] = useState('');
  const [contentKey, setContentKey] = useState(0);
  const prevModuleRef = useRef(module);

  const moduleIndex = course.modules.findIndex((m) => m.id === module.id);
  const moduleBadge = `M${moduleIndex + 1}/${course.modules.length}`;

  useEffect(() => {
    const prev = prevModuleRef.current;
    prevModuleRef.current = module;
    if (transitionStyle === 'none' || !prev || prev.id === module.id) return;

    const prevIdx = course.modules.findIndex((m) => m.id === prev.id);
    const currIdx = course.modules.findIndex((m) => m.id === module.id);
    const direction = prevIdx === -1 || currIdx >= prevIdx ? 'forward' : 'back';

    const classMap: Record<string, { forward: string; back: string }> = {
      fade: { forward: 'anim-fade', back: 'anim-fade' },
      slide: { forward: 'anim-slide-right', back: 'anim-slide-left' },
      flip: { forward: 'anim-flip', back: 'anim-flip' },
    };

    const cls = classMap[transitionStyle]?.[direction] ?? '';
    if (!cls) return;

    setContentKey((k) => k + 1);
    setAnimClass(cls);
    const timer = setTimeout(() => setAnimClass(''), 500);
    return () => clearTimeout(timer);
  }, [module, course.modules, transitionStyle]);

  const { rightPanel, setRightPanel } = useSettingsStore(
    useShallow((s) => ({
      rightPanel: s.rightPanel,
      setRightPanel: s.setRightPanel,
    })),
  );

  const headerBtnClass =
    'px-2 py-1 text-[11px] rounded bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200 transition-colors';
  const headerActiveClass =
    'px-2 py-1 text-[11px] rounded bg-indigo-700/50 border-indigo-500 text-indigo-200 transition-colors';

  const handlePanelToggle = (tab: 'sections' | 'ai' | 'notes') => {
    setRightPanel(rightPanel === tab ? false : tab);
  };

  return (
    <PageLayout>
      <PageHeader onBack={onBack} toolbar={<LessonToolbar />}>
        {!focusMode && (
          <>
            <AppearancePopover />
            {!isMobile && <ShortcutHelp />}
            {!isMobile && <div className="h-3 w-px bg-gray-600/50" />}
            {/* Segmented control: Module + Progress + Quiz + Review */}
            {!isMobile && (
              <div className="flex items-center bg-gray-800/50 border border-gray-700/60 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-300 tabular-nums whitespace-nowrap px-2 py-1">
                  {t('lesson.moduleBadge', {
                    current: moduleIndex + 1,
                    total: course.modules.length,
                    defaultValue: moduleBadge,
                  })}
                </span>
                <div className="h-3 w-px bg-gray-700/50" />
                <div className="px-2 py-1">
                  <ProgressBadge />
                </div>
                <div className="h-3 w-px bg-gray-700/50" />
                <QuizReviewButtons />
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => push({ type: 'quizHub', course })}
                className={headerBtnClass}
                title={t('lesson.quizAccess', 'Quiz Access')}
              >
                <ListChecks size={14} className="inline mr-1" />
                Quiz
              </button>
              <CardsButton />
              {!isMobile && <div className="h-3 w-px bg-gray-600/50" />}
              {!isMobile &&
                (['sections', 'ai', 'notes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handlePanelToggle(tab)}
                    className={rightPanel === tab ? headerActiveClass : headerBtnClass}
                  >
                    {tab === 'sections' && t('lesson.sections')}
                    {tab === 'ai' && 'AI'}
                    {tab === 'notes' && t('common.notes')}
                  </button>
                ))}
              {/* Mobile: overflow menu for secondary actions */}
              {isMobile && (
                <div className="relative">
                  <button
                    onClick={() => setShowOverflowMenu((v) => !v)}
                    className={rightPanel ? headerActiveClass : headerBtnClass}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {showOverflowMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOverflowMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl py-1 min-w-[140px] anim-dropdown-in">
                        {/* Module badge */}
                        <div className="px-3 py-1.5 text-[11px] text-gray-300 border-b border-gray-700/50">
                          {t('lesson.moduleBadge', {
                            current: moduleIndex + 1,
                            total: course.modules.length,
                            defaultValue: moduleBadge,
                          })}
                          <span className="ml-1.5 inline-flex items-center">
                            <ProgressBadge />
                          </span>
                        </div>
                        <QuizReviewButtons />
                        <button
                          onClick={() => {
                            push({ type: 'quizHub', course });
                            setShowOverflowMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-colors"
                        >
                          <ListChecks size={14} className="inline mr-1" />
                          Quiz Access
                        </button>
                        {(['sections', 'ai', 'notes'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              handlePanelToggle(tab);
                              setShowOverflowMenu(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-colors"
                          >
                            {tab === 'sections' && t('lesson.sections')}
                            {tab === 'ai' && 'AI'}
                            {tab === 'notes' && t('common.notes')}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </PageHeader>
      <PageContent>
        <div key={contentKey} className={`flex flex-col flex-1 min-h-0 ${animClass || ''}`}>
          <LessonSection course={course} module={module} initialSectionID={initialSectionID} />
        </div>
      </PageContent>
      {searchCourseOpen && (
        <SearchOverlay initialCourseIDs={[course.id]} onClose={() => setSearchCourseOpen(false)} />
      )}
    </PageLayout>
  );
}
