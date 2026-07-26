import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course, ModuleMeta } from '../../bun/types';
import { handleToggle } from '../components/lesson/LessonContentCompletionButton';
import LessonContentViewer from '../components/lesson/LessonContentViewer';
import NavigationPanel from '../components/lesson/NavigationPanel';
import ViewerSearch from '../components/lesson/ViewerSearch';
import PomodoroTimer from '../components/PomodoroTimer';
import BottomSheet from '../components/ui/BottomSheet';
import { loadingIndicator } from '../components/ui/variants/loading';
import { useBookmarks } from '../hooks/useBookmarks';
import { useIsMobile } from '../hooks/useIsMobile';
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

  const { toggle, showPomodoro, setSearchCourseOpen, focusMode, rightPanel, setRightPanel } =
    useLessonSection(course, module);

  const { loading, contentRef, scrollToSection } = useLesson(
    course.id,
    module.id,
    { toggle },
    initialSectionID,
  );

  const search = useLessonSearch(contentRef, module.id, initialSearchQuery);
  const activateSearch = search.setSearchActive;

  const searchTrigger = useLessonViewStore((s) => s.searchTrigger);

  useEffect(() => {
    if (searchTrigger > 0) activateSearch(true);
  }, [searchTrigger, activateSearch]);

  useBookmarks(course.id, module.id, null);
  const nav = useLessonNav(course, module);

  const { showPomodoroTimer } = useLessonAnimations({
    focusMode,
    rightPanel,
    showPomodoro,
  });

  const isMobile = useIsMobile();

  const showToolbar = useSelectionStore((s) => s.showToolbar);

  useLessonKeyboardShortcuts({
    hasPrev: nav.hasPrev,
    hasNext: nav.hasNext,
    goPrev: nav.goPrev,
    goNext: nav.goNext,
    contentRef,
    showToolbar,
    setRightPanel,
    setSearchCourseOpen,
  });

  useWheelNavigation({ contentRef, nav });

  const handleNextChapter = () => {
    void handleToggle().then(() => nav.goNext());
  };

  if (loading) return <div className={loadingIndicator()}>{t('lesson.loadingLesson')}</div>;

  return (
    <div className="flex flex-1 overflow-clip min-h-0">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative group">
        {nav.hasPrev && (
          <button
            onClick={nav.goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-32 flex items-center justify-center rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900/70 text-gray-300 hover:text-white hover:bg-gray-900/90"
            aria-label={t('lesson.prevModule')}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {nav.hasNext && (
          <button
            onClick={nav.goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-32 flex items-center justify-center rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900/70 text-gray-300 hover:text-white hover:bg-gray-900/90"
            aria-label={t('lesson.nextModule')}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {showPomodoroTimer && (
          <div className={`relative h-0 z-40 ${showPomodoro ? 'anim-pop-in' : 'anim-pop-out'}`}>
            <div className="absolute left-4 top-2">
              <PomodoroTimer compact={focusMode} />
            </div>
          </div>
        )}

        {search.searchActive && <ViewerSearch search={search} />}
        <LessonContentViewer
          search={search}
          hasNext={nav.hasNext}
          onNextChapter={handleNextChapter}
        />
      </div>

      {/* Right Sidebar — Navigation + AI Skills */}
      {!focusMode && !isMobile && (
        <div
          className={`${
            rightPanel ? 'w-72' : 'w-0'
          } overflow-hidden shrink-0 border-l border-gray-700 bg-gray-800/50 transition-all duration-300`}
        >
          <div className="w-72 h-full flex flex-col">
            <NavigationPanel
              courseId={course.id}
              moduleId={module.id}
              moduleName={module.name}
              modules={course.modules}
              onScrollToSection={scrollToSection}
              onModuleSelect={(mod, sectionID) =>
                push({ type: 'lesson', course, module: mod, sectionID })
              }
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Navigation */}
      {!focusMode && isMobile && (
        <BottomSheet open={!!rightPanel} onClose={() => setRightPanel(false)}>
          <NavigationPanel
            courseId={course.id}
            moduleId={module.id}
            moduleName={module.name}
            modules={course.modules}
            onScrollToSection={(id) => {
              scrollToSection(id);
              setRightPanel(false);
            }}
            onModuleSelect={(mod, sectionID) => {
              push({ type: 'lesson', course, module: mod, sectionID });
              setRightPanel(false);
            }}
          />
        </BottomSheet>
      )}
    </div>
  );
}
