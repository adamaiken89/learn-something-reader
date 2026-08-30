import { create } from 'zustand';

import type { Bookmark } from '../../bun/types';
import { api } from '../api';
import { showToast } from '../toast';
import { key } from './storageUtils';

interface BookmarksState {
  byModule: Record<string, Bookmark[]>;
  loading: Record<string, boolean>;
  /** All bookmarks across courses — used by the Saved hub and highlight bridge. */
  all: Bookmark[];
  allLoading: boolean;
  loadAll(): Promise<void>;
  /** Toggle a kind:'highlight' bookmark keyed by snippet within the module. */
  toggleHighlightSave(
    courseId: string,
    moduleId: string,
    snippet: string,
    sectionID: string | null,
  ): Promise<boolean>;
  load(courseId: string, moduleId: string): Promise<void>;
  toggle(
    courseId: string,
    moduleId: string,
    title: string,
    sectionID: string | null,
  ): Promise<void>;
  remove(id: string): Promise<void>;
  getForModule(courseId: string, moduleId: string): Bookmark[];
  getActive(courseId: string, moduleId: string, sectionID: string | null): Bookmark | undefined;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  byModule: {},
  loading: {},
  all: [],
  allLoading: false,

  loadAll: async () => {
    set({ allLoading: true });
    try {
      const all = await api.storage.bookmarks();
      set({ all, allLoading: false });
    } catch {
      showToast.error('toast.loadFailed');
      set({ all: [], allLoading: false });
    }
  },

  toggleHighlightSave: async (courseId, moduleId, snippet, sectionID) => {
    const existing = get().all.find(
      (b) =>
        b.kind === 'highlight' &&
        b.moduleID === moduleId &&
        b.courseID === courseId &&
        b.snippet === snippet,
    );
    if (existing) {
      await api.storage.deleteBookmark(existing.id);
      set((s) => ({
        all: s.all.filter((b) => b.id !== existing.id),
        byModule: {
          ...s.byModule,
          [key(courseId, moduleId)]: (s.byModule[key(courseId, moduleId)] ?? []).filter(
            (b) => b.id !== existing.id,
          ),
        },
      }));
      return false;
    }
    const bookmark = await api.storage.addBookmark({
      courseID: courseId,
      moduleID: moduleId,
      title: snippet,
      sectionID: sectionID ?? undefined,
      kind: 'highlight',
      snippet,
    });
    set((s) => ({ all: [...s.all, bookmark] }));
    return true;
  },

  load: async (courseId, moduleId) => {
    const k = key(courseId, moduleId);
    set((s) => ({ loading: { ...s.loading, [k]: true } }));
    try {
      const bookmarks = await api.storage.moduleBookmarks(courseId, moduleId);
      set((s) => ({ byModule: { ...s.byModule, [k]: bookmarks } }));
    } catch {
      showToast.error('toast.loadFailed');
      set((s) => ({ byModule: { ...s.byModule, [k]: [] } }));
    } finally {
      set((s) => ({ loading: { ...s.loading, [k]: false } }));
    }
  },

  toggle: async (courseId, moduleId, title, sectionID) => {
    const k = key(courseId, moduleId);
    const existing = sectionID
      ? get().byModule[k]?.find((b) => b.sectionID === sectionID)
      : get().byModule[k]?.find((b) => !b.sectionID);
    if (existing) {
      await api.storage.deleteBookmark(existing.id);
      set((s) => ({
        byModule: { ...s.byModule, [k]: s.byModule[k]?.filter((b) => b.id !== existing.id) ?? [] },
      }));
    } else {
      const bookmark = await api.storage.addBookmark({
        courseID: courseId,
        moduleID: moduleId,
        title,
        sectionID: sectionID ?? undefined,
        kind: sectionID ? 'section' : 'module',
      });
      set((s) => ({
        byModule: { ...s.byModule, [k]: [...(s.byModule[k] ?? []), bookmark] },
      }));
    }
  },

  remove: async (id) => {
    await api.storage.deleteBookmark(id);
    set((s) => {
      const byModule = { ...s.byModule };
      for (const k of Object.keys(byModule)) {
        byModule[k] = byModule[k].filter((b) => b.id !== id);
      }
      return { byModule, all: s.all.filter((b) => b.id !== id) };
    });
  },

  getForModule: (courseId, moduleId) => {
    return get().byModule[key(courseId, moduleId)] ?? [];
  },

  getActive: (courseId, moduleId, sectionID) => {
    const bookmarks = get().byModule[key(courseId, moduleId)] ?? [];
    return sectionID
      ? bookmarks.find((b) => b.sectionID === sectionID)
      : bookmarks.find((b) => !b.sectionID);
  },
}));
