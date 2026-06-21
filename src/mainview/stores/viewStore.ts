import { create } from "zustand";

export interface Subject {
  id: string;
  subject: string;
  displayName: string;
  modules: { id: number; name: string; timeHours: number; prerequisites: number[] }[];
  timeBudgetHours: number;
  targetLevel: string;
  learningObjectives: string[];
}

export interface ModuleMeta {
  id: number;
  name: string;
  timeHours: number;
  prerequisites: number[];
}

export type View =
  | { type: "subjectList" }
  | { type: "lesson"; subject: Subject; module: ModuleMeta }
  | { type: "quiz"; subject: Subject; module: ModuleMeta }
  | { type: "review"; subject: Subject }
  | { type: "settings" }
  | { type: "bookmarks" };

interface ViewState {
  views: View[];
  push: (view: View) => void;
  pop: () => void;
  popToRoot: () => void;
  replace: (view: View) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  views: [{ type: "subjectList" as const }],
  push: (view) => set((s) => ({ views: [...s.views, view] })),
  pop: () => set((s) => ({ views: s.views.slice(0, -1) })),
  popToRoot: () => set({ views: [{ type: "subjectList" as const }] }),
  replace: (view) => set((s) => ({ views: [...s.views.slice(0, -1), view] })),
}));
