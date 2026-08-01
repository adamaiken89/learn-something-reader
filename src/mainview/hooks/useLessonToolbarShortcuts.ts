import { useShallow } from 'zustand/react/shallow';

import type { Course, ModuleMeta } from '../../bun/types';
import { useBookmarksStore } from '../stores/bookmarksStore';
import { useCourseStore } from '../stores/courseStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useViewStore } from '../stores/viewStore';
import { useShortcuts } from './useShortcuts';

export function useLessonToolbarShortcuts(course: Course, module: ModuleMeta): void {
  const push = useViewStore((s) => s.push);
  const courses = useCourseStore((s) => s.courses);
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
  useShortcuts('lessonToolbar', {
    decFontSize,
    incFontSize,
    cycleTheme,
    toggleWidth: () => {
      const order: Array<'narrow' | 'standard' | 'wide' | 'full'> = [
        'narrow',
        'standard',
        'wide',
        'full',
      ];
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
    reviewCards: () => {
      if (!course) return;
      const found = courses.find((c) => c.id === course.id);
      if (found) push({ type: 'review', course: found });
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
