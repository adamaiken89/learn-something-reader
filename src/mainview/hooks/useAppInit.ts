import { useEffect } from 'react';

import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useSyncStore } from '../stores/syncStore';

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
        if (syncState.remoteRepoURL) {
          void useSyncStore
            .getState()
            .startSync()
            .then(() => {
              useCourseStore.getState().reset();
              void useCourseStore
                .getState()
                .load()
                .then((courses) => {
                  void useCompletionStore.getState().loadAll(courses.map((c) => c.id));
                });
            });
        }
      });
  }, []);
}
