import { create } from 'zustand';

import type { MetaField } from '../../bun/lessonMarkdown';
import type { Section } from '../../bun/types';

interface LessonViewState {
  content: string;
  sections: Section[];
  contentRef: React.RefObject<HTMLDivElement | null>;
  scrollToSection: (sectionId: string) => void;
  h1: string;
  meta: MetaField[];
  courseId: string;
  moduleId: string;
  bodyContent: string;
  loading: boolean;
  searchTrigger: number;
  setContent: (content: string) => void;
  setSections: (sections: Section[]) => void;
  setContentRef: (ref: React.RefObject<HTMLDivElement | null>) => void;
  setScrollToSection: (fn: (sectionId: string) => void) => void;
  setH1: (h1: string) => void;
  setMeta: (meta: MetaField[]) => void;
  setCourseId: (id: string) => void;
  setModuleId: (id: string) => void;
  setBodyContent: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setSearchTrigger: (trigger: number) => void;
}

export const useLessonViewStore = create<LessonViewState>((set) => ({
  content: '',
  sections: [],
  contentRef: { current: null } as React.RefObject<HTMLDivElement | null>,
  scrollToSection: () => {},
  h1: '',
  meta: [],
  courseId: '',
  moduleId: '',
  bodyContent: '',
  loading: true,
  searchTrigger: 0,
  setContent: (content) => set({ content }),
  setSections: (sections) => set({ sections }),
  setContentRef: (contentRef) => set({ contentRef }),
  setScrollToSection: (scrollToSection) => set({ scrollToSection }),
  setH1: (h1) => set({ h1 }),
  setMeta: (meta) => set({ meta }),
  setCourseId: (courseId) => set({ courseId }),
  setModuleId: (moduleId) => set({ moduleId }),
  setBodyContent: (bodyContent) => set({ bodyContent }),
  setLoading: (loading) => set({ loading }),
  setSearchTrigger: (searchTrigger) => set({ searchTrigger }),
}));
