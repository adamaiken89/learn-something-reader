import { useEffect } from 'react';

import { logger } from '../logger';
import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useSyncStore } from '../stores/syncStore';

/** Module-level: survives React StrictMode double-mounts, so auto-sync runs at
 * most once per app session in any mode. Manual sync (shortcut/button) is not
 * affected — it goes through useSyncNow. */
let didAutoSync = false;

function reloadCourses(): void {
  useCourseStore.getState().reset();
  void useCourseStore
    .getState()
    .load()
    .then((courses) => {
      void useCompletionStore.getState().loadAll(courses.map((c) => c.id));
    });
}

export function useAppInit() {
  const loadCourses = useCourseStore((s) => s.load);

  useEffect(() => {
    void loadCourses().then((courses) => {
      void useCompletionStore.getState().loadAll(courses.map((c) => c.id));
    });
  }, [loadCourses]);

  useEffect(() => {
    void useSyncStore
      .getState()
      .loadStatus()
      .then(() => {
        const syncState = useSyncStore.getState();
        if (!syncState.remoteRepoURL || didAutoSync) return;
        // Dev mode: never auto-sync — it would REPLACE the dev subjects dir
        // (src/bun/subjects or src/subjects) with the remote clone, wiping
        // unpushed local course edits. Manual sync still available.
        if (import.meta.env.DEV) {
          logger.info('Auto-sync skipped in dev mode (manual sync available)');
          return;
        }
        didAutoSync = true;
        void syncState.startSync().then((result) => {
          if (result.success && !result.unchanged) reloadCourses();
        });
      });
  }, []);
}
