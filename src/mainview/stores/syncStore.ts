import { create } from 'zustand';

import { api } from '../api';
import { logger } from '../logger';
import { showToast } from '../toast';

interface SyncStartResult {
  success: boolean;
  /** Remote unchanged since last sync — nothing was fetched. */
  unchanged?: boolean;
  /** Sync not started (already running or attempted concurrently). */
  skipped?: boolean;
  error?: string;
}

interface SyncState {
  lastSyncTime: string | null;
  lastSyncedCommit: string | null;
  isSyncing: boolean;
  remoteRepoURL: string;
  error: string | null;
  loadStatus: () => Promise<void>;
  startSync: (force?: boolean) => Promise<SyncStartResult>;
  setRepoURL: (url: string) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  lastSyncTime: null,
  lastSyncedCommit: null,
  isSyncing: false,
  remoteRepoURL: '',
  error: null,

  loadStatus: async () => {
    try {
      const status = await api.sync.status();
      set({
        lastSyncTime: status.lastSyncTime,
        lastSyncedCommit: status.lastSyncedCommit,
        isSyncing: status.isSyncing,
        remoteRepoURL: status.remoteRepoURL,
        error: null,
      });
      logger.debug({ remoteRepoURL: status.remoteRepoURL }, 'Sync status loaded');
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'Failed to load sync status');
      showToast.error('toast.loadFailed');
      set({ error: (e as Error).message });
    }
  },

  startSync: async (force?: boolean) => {
    if (get().isSyncing) return { success: false, skipped: true };
    logger.info('Starting sync');
    set({ isSyncing: true, error: null });
    try {
      const result = await api.sync.start(force);
      if (result.success) {
        logger.info({ commitHash: result.commitHash }, 'Sync completed');
        // Silent no-op: don't toast "complete" when nothing was fetched.
        if (!result.unchanged) showToast.success('toast.syncComplete');
        set({
          lastSyncTime: new Date().toISOString(),
          lastSyncedCommit: result.commitHash,
          isSyncing: false,
        });
        return { success: true, unchanged: result.unchanged };
      }
      // Concurrent attempt while another sync runs — not an error.
      if (result.message === 'Sync already in progress') {
        logger.warn('Sync skipped: already in progress');
        set({ isSyncing: false });
        return { success: false, skipped: true };
      }
      logger.warn({ message: result.message }, 'Sync failed');
      showToast.error('toast.syncFailed');
      set({ isSyncing: false, error: result.message });
      return { success: false, error: result.message };
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'Sync error');
      showToast.error('toast.syncFailed');
      const message = (e as Error).message;
      set({ isSyncing: false, error: message });
      return { success: false, error: message };
    }
  },

  setRepoURL: async (url: string) => {
    try {
      await api.sync.setURL(url);
      set({ remoteRepoURL: url, error: null });
      logger.info('Sync repo URL set');
    } catch (e) {
      logger.error({ err: (e as Error).message }, 'Failed to set sync repo URL');
      showToast.error('toast.loadFailed');
      set({ error: (e as Error).message });
    }
  },
}));
