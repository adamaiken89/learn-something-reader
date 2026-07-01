import { create } from 'zustand';

interface LessonUIState {
  showTools: boolean;
  showPomodoro: boolean;
  searchCourseOpen: boolean;
  visibleSection: string | null;
  toggleTools: () => void;
  togglePomodoro: () => void;
  setSearchCourseOpen: (v: boolean) => void;
  setVisibleSection: (id: string | null) => void;
}

export const useLessonUIStore = create<LessonUIState>((set) => ({
  showTools: false,
  showPomodoro: false,
  searchCourseOpen: false,
  visibleSection: null,
  toggleTools: () => set((s) => ({ showTools: !s.showTools })),
  togglePomodoro: () => set((s) => ({ showPomodoro: !s.showPomodoro })),
  setSearchCourseOpen: (v) => set({ searchCourseOpen: v }),
  setVisibleSection: (id) => set({ visibleSection: id }),
}));
