import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../bun/types';
import { api } from './api';
import SearchOverlay from './components/SearchOverlay';
import { useAppInit } from './hooks/useAppInit';
import { useClipboardFallback } from './hooks/useClipboardFallback';
import { useQuizDueNotification } from './hooks/useQuizDueNotification';
import { useShortcuts } from './hooks/useShortcuts';
import { useWindowTitle } from './hooks/useWindowTitle';
import BookmarksPage from './pages/BookmarksPage';
import CumulativeQuizPage from './pages/CumulativeQuizPage';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import QuizHubPage from './pages/QuizHubPage';
import QuizPage from './pages/QuizPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import SyllabusPage from './pages/SyllabusPage';
import { useViewStore } from './stores/viewStore';

export default function App() {
  const { t } = useTranslation();
  const views = useViewStore((s) => s.views);
  const pop = useViewStore((s) => s.pop);
  const replace = useViewStore((s) => s.replace);
  const currentView = views[views.length - 1];

  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useAppInit();
  useClipboardFallback();
  useQuizDueNotification();
  useWindowTitle();

  useEffect(() => {
    if (currentView) {
      setLoading(false);
      return;
    }
    void api.session.get().then((last) => {
      if (last) {
        replace({
          type: 'lesson',
          course: last.course,
          module: last.module,
          sectionID: last.sectionId,
        });
      } else {
        replace({ type: 'dashboard' });
      }
      setLoading(false);
    });
  }, [currentView, replace]);

  useShortcuts('global', {
    search: () => setSearchOpen(true),
  });

  if (loading || !currentView) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center">
        {t('common.loading')}
      </div>
    );
  }

  const viewContent = (() => {
    switch (currentView.type) {
      case 'lesson':
        return (
          <LessonPage
            course={currentView.course}
            module={currentView.module}
            initialSectionID={currentView.sectionID}
            onBack={() => replace({ type: 'dashboard' })}
          />
        );

      case 'quiz':
        return <QuizPage course={currentView.course} module={currentView.module} onBack={pop} />;

      case 'cumulativeQuiz':
        return (
          <CumulativeQuizPage
            course={currentView.course}
            cumulativeQuizId={currentView.cumulativeQuizId}
            onBack={pop}
          />
        );

      case 'review':
        return <ReviewPage courseId={currentView.course.id} onBack={pop} />;

      case 'quizHub':
        return <QuizHubPage course={currentView.course} onBack={pop} />;

      case 'settings':
        return <SettingsPage onBack={pop} />;

      case 'syllabus':
        return <SyllabusPage course={currentView.course} onBack={pop} />;

      case 'bookmarks':
        return (
          <BookmarksPage
            onBack={pop}
            onOpen={(courseID, moduleID, sectionID, courses) => {
              const course = courses.find((c: Course) => c.id === courseID);
              const module = course?.modules.find((m) => m.id === moduleID);
              if (course && module) {
                replace({ type: 'lesson', course, module, sectionID: sectionID ?? undefined });
              }
            }}
          />
        );

      case 'dashboard':
        return <DashboardPage />;
    }
  })();

  return (
    <>
      <div key={currentView.type} className="anim-fade-in-up" style={{ animationDuration: '0.2s' }}>
        {viewContent}
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
