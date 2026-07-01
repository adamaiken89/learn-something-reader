import { create } from 'zustand';

import { api } from '../api';
import { logger } from '../logger';
import { showToast } from '../toast';

function key(courseId: string, moduleId: string) {
  return `${courseId}:${moduleId}`;
}

export function countCompleted(completed: Record<string, boolean>, courseId: string): number {
  const prefix = courseId + ':';
  let n = 0;
  for (const [k, v] of Object.entries(completed)) {
    if (k.startsWith(prefix) && v) n++;
  }
  return n;
}

interface CompletionState {
  completed: Record<string, boolean>;
  totalModules: Record<string, number>;
  loading: Record<string, boolean>;
  loaded: boolean;
  optimisticCompleted: Record<string, boolean>;
  load(courseId: string, moduleId: string): Promise<void>;
  loadCourse(courseId: string): Promise<void>;
  loadModules(courseId: string): Promise<void>;
  loadAll(courseIds: string[]): Promise<void>;
  toggle(courseId: string, moduleId: string): Promise<void>;
  get(courseId: string, moduleId: string): boolean;
  getProgress(courseId: string): { completed: number; total: number };
  setOptimisticCompleted(courseId: string, moduleId: string, value: boolean): void;
  clearOptimisticCompleted(courseId: string, moduleId: string): void;
  getEffectiveCompleted(courseId: string, moduleId: string): boolean;
}

export const useCompletionStore = create<CompletionState>((set, get) => ({
  completed: {},
  totalModules: {},
  loading: {},
  loaded: false,
  optimisticCompleted: {},

  load: async (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    try {
      const result = await api.storage.isCompleted(courseId, moduleId);
      set((s) => ({ completed: { ...s.completed, [k]: result.completed } }));
    } catch {
      showToast.error('toast.loadFailed');
    }
  },

  loadCourse: async (courseId) => {
    set((s) => ({ loading: { ...s.loading, [courseId]: true } }));
    try {
      const mods = await api.courses.modules(courseId);
      const { moduleIDs } = await api.storage.completedModules(courseId);
      set((s) => {
        const completed = { ...s.completed };
        for (const mid of moduleIDs) {
          completed[`${courseId}:${mid}`] = true;
        }
        return {
          totalModules: { ...s.totalModules, [courseId]: mods.length },
          completed,
        };
      });
    } catch {
      showToast.error('toast.loadFailed');
    } finally {
      set((s) => ({ loading: { ...s.loading, [courseId]: false } }));
    }
  },

  loadModules: async (courseId) => {
    try {
      const { moduleIDs } = await api.storage.completedModules(courseId);
      set((s) => {
        const completed = { ...s.completed };
        for (const mid of moduleIDs) {
          completed[`${courseId}:${mid}`] = true;
        }
        return { completed };
      });
    } catch {
      showToast.error('toast.loadFailed');
    }
  },

  loadAll: async (courseIds) => {
    if (get().loaded) return;
    const results = await Promise.all(
      courseIds.map(async (cid) => {
        try {
          const { moduleIDs } = await api.storage.completedModules(cid);
          return { cid, moduleIDs };
        } catch {
          return { cid, moduleIDs: [] as string[] };
        }
      }),
    );
    set((s) => {
      const completed = { ...s.completed };
      for (const { cid, moduleIDs } of results) {
        for (const mid of moduleIDs) {
          completed[`${cid}:${mid}`] = true;
        }
      }
      return { completed, loaded: true };
    });
  },

  toggle: async (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    try {
      const result = await api.storage.toggleCompleted(courseId, moduleId);
      set((s) => ({ completed: { ...s.completed, [k]: result.completed } }));
      if (result.completed) {
        api.stats
          .logSession({
            courseID: courseId,
            moduleID: moduleId,
            durationMinutes: 10,
            type: 'reading',
          })
          .catch((err) => {
            logger.warn({ err }, 'Failed to log reading session');
          });
      }
    } catch {
      showToast.error('toast.loadFailed');
    }
  },

  get: (courseId, moduleId) => {
    return get().completed[key(courseId, moduleId)] ?? false;
  },

  getProgress: (courseId) => {
    return {
      completed: countCompleted(get().completed, courseId),
      total: get().totalModules[courseId] ?? 0,
    };
  },

  setOptimisticCompleted: (courseId, moduleId, value) => {
    const k = key(courseId, moduleId);
    set((s) => ({ optimisticCompleted: { ...s.optimisticCompleted, [k]: value } }));
  },

  clearOptimisticCompleted: (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    set((s) => {
      const next = { ...s.optimisticCompleted };
      delete next[k];
      return { optimisticCompleted: next };
    });
  },

  getEffectiveCompleted: (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    const s = get();
    if (k in s.optimisticCompleted) return s.optimisticCompleted[k];
    return s.completed[k] ?? false;
  },
}));
