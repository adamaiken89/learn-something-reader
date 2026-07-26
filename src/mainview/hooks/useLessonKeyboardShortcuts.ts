import { useLessonViewStore } from '../stores/lessonViewStore';
import type { RightPanel } from '../stores/settingsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useShortcuts } from './useShortcuts';

export interface UseLessonKeyboardShortcutsParams {
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  showToolbar: boolean;
  setRightPanel: (v: RightPanel) => void;
  setSearchCourseOpen: (v: boolean) => void;
}

export function useLessonKeyboardShortcuts({
  hasPrev,
  hasNext,
  goPrev,
  goNext,
  contentRef,
  showToolbar,
  setRightPanel,
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
      const current = useSettingsStore.getState().rightPanel;
      setRightPanel(current === 'sections' ? false : 'sections');
    },
    toggleNotes: () => {
      const current = useSettingsStore.getState().rightPanel;
      setRightPanel(current === 'notes' ? false : 'notes');
    },
    toggleAI: () => {
      const current = useSettingsStore.getState().rightPanel;
      setRightPanel(current === 'ai' ? false : 'ai');
    },
    findInPage: () =>
      useLessonViewStore
        .getState()
        .setSearchTrigger(useLessonViewStore.getState().searchTrigger + 1),
    courseSearch: () => setSearchCourseOpen(true),
  });
}
