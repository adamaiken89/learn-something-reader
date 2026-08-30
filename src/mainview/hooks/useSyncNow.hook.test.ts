import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import { toastCallState } from '../../testFsShared';
import { useSyncStore } from '../stores/syncStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import { useSyncNow } from './useSyncNow';

setupRPC();

beforeEach(() => {
  toastCallState.method = '';
  toastCallState.args = [];
  useSyncStore.setState({
    lastSyncTime: null,
    lastSyncedCommit: null,
    isSyncing: false,
    remoteRepoURL: '',
    error: null,
  });
  clearMocks();
});

describe('useSyncNow', () => {
  test('no-ops when no remote repo configured', async () => {
    const { result } = renderHook(() => useSyncNow());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current();
    });
    expect(ok).toBe(false);
  });

  test('force syncs, reloads courses on new content, returns true', async () => {
    useSyncStore.setState({ remoteRepoURL: 'https://github.com/u/r' });
    mockResponse('syncStart', { success: true, commitHash: 'def', message: 'OK' });
    mockResponse('coursesList', []);
    mockResponse('getCompletedModuleIDs', []);
    mockResponse('getGlobalStats', { courseSummaries: [] });
    const { result } = renderHook(() => useSyncNow());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current();
    });
    expect(ok).toBe(true);
    expect(useSyncStore.getState().lastSyncedCommit).toBe('def');
    expect(toastCallState.method).toBe('success');
  });

  test('skipped sync returns false', async () => {
    useSyncStore.setState({ remoteRepoURL: 'https://github.com/u/r', isSyncing: true });
    const { result } = renderHook(() => useSyncNow());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current();
    });
    expect(ok).toBe(false);
    expect(useSyncStore.getState().isSyncing).toBe(true);
  });

  test('failed sync returns false', async () => {
    useSyncStore.setState({ remoteRepoURL: 'https://github.com/u/r' });
    mockResponse('syncStart', {
      success: false,
      commitHash: '',
      message: 'No remote repository configured',
    });
    const { result } = renderHook(() => useSyncNow());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current();
    });
    expect(ok).toBe(false);
  });
});
