import { create } from 'zustand';

import type { Highlight } from '../../bun/types';
import { api } from '../api';
import { showToast } from '../toast';
import { key } from './storageUtils';

interface HighlightsState {
  byModule: Record<string, Highlight[]>;
  loading: Record<string, boolean>;
  load(courseId: string, moduleId: string): Promise<void>;
  add(
    courseId: string,
    moduleId: string,
    text: string,
    color: string,
    startOffset?: number,
    endOffset?: number,
    sectionID?: string | null,
  ): Promise<void>;
  remove(id: string): Promise<void>;
  getForModule(courseId: string, moduleId: string): Highlight[];
}

export const useHighlightsStore = create<HighlightsState>((set, get) => ({
  byModule: {},
  loading: {},

  load: async (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    set((s) => ({ loading: { ...s.loading, [k]: true } }));
    try {
      const highlights = await api.storage.highlights(courseId, moduleId);
      set((s) => ({ byModule: { ...s.byModule, [k]: highlights } }));
    } catch {
      showToast.error('toast.loadFailed');
      set((s) => ({ byModule: { ...s.byModule, [k]: [] } }));
    } finally {
      set((s) => ({ loading: { ...s.loading, [k]: false } }));
    }
  },

  add: async (
    courseId,
    moduleId,
    text,
    color,
    startOffset = 0,
    endOffset = 0,
    sectionID = null,
  ) => {
    const highlight = await api.storage.addHighlight({
      courseID: courseId,
      moduleID: moduleId,
      selectedText: text,
      startOffset,
      endOffset,
      color,
      sectionID,
    });
    const k = key(courseId, moduleId);
    set((s) => {
      const existing = s.byModule[k] ?? [];
      const idx = existing.findIndex((h) => h.id === highlight.id);
      if (idx >= 0) {
        const next = [...existing];
        next[idx] = highlight;
        return { byModule: { ...s.byModule, [k]: next } };
      }
      return { byModule: { ...s.byModule, [k]: [...existing, highlight] } };
    });
  },

  remove: async (id) => {
    await api.storage.deleteHighlight(id);
    set((s) => {
      const byModule = { ...s.byModule };
      for (const k of Object.keys(byModule)) {
        byModule[k] = byModule[k].filter((h) => h.id !== id);
      }
      return { byModule };
    });
  },

  getForModule: (courseId, moduleId) => {
    return get().byModule[key(courseId, moduleId)] ?? [];
  },
}));
