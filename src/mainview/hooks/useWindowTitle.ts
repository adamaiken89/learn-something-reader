import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../api';
import { useViewStore } from '../stores/viewStore';

export function useWindowTitle() {
  const { t } = useTranslation();
  const views = useViewStore((s) => s.views);
  const currentView = views[views.length - 1];
  const prevTitle = useRef('');

  useEffect(() => {
    if (!currentView) return;

    let title: string;
    switch (currentView.type) {
      case 'lesson': {
        const modIdx =
          currentView.course.modules.findIndex((m) => m.id === currentView.module.id) + 1;
        const modTotal = currentView.course.modules.length;
        title = `CourseReader — ${currentView.course.displayName} — ${currentView.module.name} (${modIdx}/${modTotal})`;
        break;
      }
      case 'quiz':
        title = `CourseReader — ${currentView.course.displayName} — ${t('common.quiz')}`;
        break;
      case 'review':
        title = `CourseReader — ${currentView.course.displayName} — ${t('common.review')}`;
        break;
      case 'userCardReview':
        title = `CourseReader — ${currentView.course.displayName} — ${t('common.review')}`;
        break;
      case 'settings':
        title = `CourseReader — ${t('common.settings')}`;
        break;
      case 'bookmarks':
        title = `CourseReader — ${t('common.bookmarks')}`;
        break;
      case 'dashboard':
        title = `CourseReader — ${t('dashboard.title')}`;
        break;
    }

    if (title !== prevTitle.current) {
      prevTitle.current = title;
      void api.window.setTitle(title);
    }
  }, [currentView, t]);
}
