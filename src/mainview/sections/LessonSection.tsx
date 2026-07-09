import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import LessonContentViewer from '../components/lesson/LessonContentViewer';
import NavigationPanel from '../components/lesson/NavigationPanel';
import ViewerSearch from '../components/lesson/ViewerSearch';
import PomodoroTimer from '../components/PomodoroTimer';
import StudyTools from '../components/StudyTools';
import { useBookmarks } from '../hooks/useBookmarks';
import { useLesson } from '../hooks/useLesson';
import { useLessonAnimations } from '../hooks/useLessonAnimations';
import { useLessonKeyboardShortcuts } from '../hooks/useLessonKeyboardShortcuts';
import { useLessonNav } from '../hooks/useLessonNav';
import { useLessonSearch } from '../hooks/useLessonSearch';
import { useLessonSection } from '../hooks/useLessonSection';
import { useWheelNavigation } from '../hooks/useWheelNavigation';
import { useLessonViewStore } from '../stores/lessonViewStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewStore } from '../stores/viewStore';

interface Props {
  course: Course;
  module: ModuleMeta;
  initialSectionID?: string;
  initialSearchQuery?: string | null;
}

export default function LessonSection({
  course,
  module,
  initialSectionID,
  initialSearchQuery,
}: Props) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);

  const {
    toggle,
    showTools,
    showPomodoro,
    toggleTools,
    setSearchCourseOpen,
    focusMode,
    showSections,
    toggleSections,
  } = useLessonSection(course, module);

  const { loading, contentRef, scrollToSection } = useLesson(
    course.id,
    module.id,
    { toggle },
    initialSectionID,
  );

  const search = useLessonSearch(contentRef, module.id, initialSearchQuery);
  const activateSearch = search.setSearchActive;

  const sections = useLessonViewStore((s) => s.sections);
  const searchTrigger = useLessonViewStore((s) => s.searchTrigger);

  useEffect(() => {
    if (searchTrigger > 0) activateSearch(true);
  }, [searchTrigger, activateSearch]);

  useBookmarks(course.id, module.id, null);
  const nav = useLessonNav(course, module);

  const { showStudyTools, showSectionsPanel, showPomodoroTimer } = useLessonAnimations({
    showTools,
    focusMode,
    showSections,
    showPomodoro,
  });

  const showToolbar = useSelectionStore((s) => s.showToolbar);

  useLessonKeyboardShortcuts({
    hasPrev: nav.hasPrev,
    hasNext: nav.hasNext,
    goPrev: nav.goPrev,
    goNext: nav.goNext,
    contentRef,
    showToolbar,
    toggleSections,
    setSearchCourseOpen,
  });

  useWheelNavigation({ contentRef, nav });

  if (loading)
    return <div className="p-8 text-center text-gray-400">{t('lesson.loadingLesson')}</div>;

  return (
    <div className="flex flex-1 overflow-clip min-h-0">
      {showStudyTools && (
        <div
          className={
            showTools && !focusMode ? 'anim-panel-slide-left' : 'anim-panel-slide-left-exit'
          }
        >
          <StudyTools onClose={() => toggleTools()} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!showSections && !focusMode && (
          <button
            onClick={toggleSections}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 shadow-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            ☰
          </button>
        )}

        {showPomodoroTimer && (
          <div className={`relative h-0 z-40 ${showPomodoro ? 'anim-pop-in' : 'anim-pop-out'}`}>
            <div className="absolute left-4 top-2">
              <PomodoroTimer compact={focusMode} />
            </div>
          </div>
        )}

        {showSectionsPanel && (
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 overflow-visible">
            <div
              className={
                showSections && !focusMode
                  ? 'anim-panel-slide-right'
                  : 'anim-panel-slide-right-exit'
              }
            >
              <NavigationPanel
                sections={sections}
                courseId={course.id}
                moduleId={module.id}
                moduleName={module.name}
                modules={course.modules}
                currentModuleId={module.id}
                hasPrev={nav.hasPrev}
                hasNext={nav.hasNext}
                onGoPrev={nav.goPrev}
                onGoNext={nav.goNext}
                onScrollToSection={scrollToSection}
                onModuleSelect={(mod) => push({ type: 'lesson', course, module: mod })}
                onClose={toggleSections}
              />
            </div>
          </div>
        )}

        {search.searchActive && <ViewerSearch search={search} />}
        <LessonContentViewer search={search} />
      </div>
    </div>
  );
}
