import { useLessonViewStore } from '../stores/lessonViewStore';
import { useShortcuts } from './useShortcuts';

export interface UseLessonKeyboardShortcutsParams {
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  showToolbar: boolean;
  toggleSections: () => void;
  setSearchCourseOpen: (v: boolean) => void;
}

export function useLessonKeyboardShortcuts({
  hasPrev,
  hasNext,
  goPrev,
  goNext,
  contentRef,
  showToolbar,
  toggleSections,
  setSearchCourseOpen,
}: UseLessonKeyboardShortcutsParams): void {
  useShortcuts('lesson', {
    prevModule: () => {
      if (showToolbar) return;
      if (hasPrev) goPrev();
    },
    nextModule: () => {
      if (showToolbar) return;
      if (hasNext) goNext();
    },
    scrollUp: () => {
      if (showToolbar) return;
      contentRef.current?.scrollBy({ top: -80, behavior: 'smooth' });
    },
    scrollDown: () => {
      if (showToolbar) return;
      contentRef.current?.scrollBy({ top: 80, behavior: 'smooth' });
    },
    toggleSections: () => {
      if (showToolbar) return;
      toggleSections();
    },
    findInPage: () =>
      useLessonViewStore
        .getState()
        .setSearchTrigger(useLessonViewStore.getState().searchTrigger + 1),
    courseSearch: () => setSearchCourseOpen(true),
  });
}
