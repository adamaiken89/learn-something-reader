import { useCallback } from 'react';

import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useSyncStore } from '../stores/syncStore';

/**
 * Cross-store orchestration for manual sync (shortcut, header button, Settings).
 * Pass force=true to bypass the unchanged short-circuit (header button,
 * shortcut); omit to honor the backend short-circuit (Settings checkbox).
 * Reloads courses and completion state only when the sync fetched new content. Returns
 * false when the sync was skipped or failed.
 */
export function useSyncNow() {
  return useCallback(async (force?: boolean): Promise<boolean> => {
    const { remoteRepoURL, startSync } = useSyncStore.getState();
    if (!remoteRepoURL) return false;
    const result = await startSync(force);
    if (!result.success) return false;
    if (result.unchanged) return true;
    useCourseStore.getState().reset();
    const courses = await useCourseStore.getState().load();
    void useCompletionStore.getState().loadAll(courses.map((c) => c.id));
    return true;
  }, []);
}
