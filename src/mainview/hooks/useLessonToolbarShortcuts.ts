import { useShallow } from 'zustand/react/shallow';

import type { Course, ModuleMeta } from '../../bun/types';
import { useBookmarksStore } from '../stores/bookmarksStore';
import { useCourseStore } from '../stores/courseStore';
import { useLessonUIStore } from '../stores/lessonUIStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';
import { useShortcuts } from './useShortcuts';

export function useLessonToolbarShortcuts(course: Course, module: ModuleMeta): void {
  const courses = useCourseStore((s) => s.courses);
  const push = useViewStore((s) => s.push);
  const {
    incFontSize,
    decFontSize,
    cycleTheme,
    contentWidth,
    setContentWidth,
    toggleFocusMode,
    transitionStyle,
    setTransitionStyle,
  } = useSettingsStore(
    useShallow((s) => ({
      incFontSize: s.incFontSize,
      decFontSize: s.decFontSize,
      cycleTheme: s.cycleTheme,
      contentWidth: s.contentWidth,
      setContentWidth: s.setContentWidth,
      toggleFocusMode: s.toggleFocusMode,
      transitionStyle: s.transitionStyle,
      setTransitionStyle: s.setTransitionStyle,
    })),
  );
  const { toggleTools, togglePomodoro } = useLessonUIStore(
    useShallow((s) => ({
      toggleTools: s.toggleTools,
      togglePomodoro: s.togglePomodoro,
    })),
  );

  useShortcuts('lessonToolbar', {
    decFontSize,
    incFontSize,
    cycleTheme,
    toggleWidth: () => {
      const order: Array<'narrow' | 'standard' | 'wide'> = ['narrow', 'standard', 'wide'];
      const next = order[(order.indexOf(contentWidth) + 1) % order.length];
      setContentWidth(next);
    },
    bookmark: () => {
      if (!course || !module) return;
      const k = `${course.id}:${module.id}`;
      const bm = useBookmarksStore.getState().byModule[k] ?? [];
      const existing = bm.find((b) => !b.sectionID);
      if (existing) {
        void useBookmarksStore.getState().remove(existing.id);
      } else {
        void useBookmarksStore.getState().toggle(course.id, module.id, module.name, null);
      }
    },
    focusMode: toggleFocusMode,
    pomodoro: togglePomodoro,
    tools: toggleTools,
    reviewCards: () => {
      if (!course) return;
      const found = courses.find((c) => c.id === course.id);
      if (found) push({ type: 'userCardReview', course: found });
    },
    quiz: () => {
      if (!course || !module) return;
      push({ type: 'quiz', course, module });
    },
    review: () => {
      if (!course) return;
      push({ type: 'review', course });
    },
    cycleTransition: () => {
      const order: Array<'none' | 'flip' | 'slide' | 'fade'> = ['none', 'flip', 'slide', 'fade'];
      const next = order[(order.indexOf(transitionStyle) + 1) % order.length];
      setTransitionStyle(next);
    },
  });
}
