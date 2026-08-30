import { beforeEach, describe, expect, test } from 'bun:test';

import { toastCallState } from '../../testFsShared';
import { clearMocks, deleteMock, mockResponse, setupRPC } from '../testUtils';
import { useSyncStore } from './syncStore';

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

describe('syncStore', () => {
  test('loadStatus sets sync state', async () => {
    const status = {
      lastSyncTime: '2024-01-01T00:00:00Z',
      lastSyncedCommit: 'abc',
      isSyncing: false,
      remoteRepoURL: 'https://github.com/user/repo',
    };
    mockResponse('getSyncStatus', status);
    await useSyncStore.getState().loadStatus();
    const state = useSyncStore.getState();
    expect(state.lastSyncTime).toBe('2024-01-01T00:00:00Z');
    expect(state.lastSyncedCommit).toBe('abc');
    expect(state.remoteRepoURL).toBe('https://github.com/user/repo');
    expect(state.error).toBeNull();
  });

  test('loadStatus handles error', async () => {
    const origError = console.error;
    const origWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    deleteMock('getSyncStatus');
    await useSyncStore.getState().loadStatus();
    expect(useSyncStore.getState().error).toBeTruthy();
    console.error = origError;
    console.warn = origWarn;
  });

  test('startSync successful sync returns success and toasts', async () => {
    mockResponse('syncStart', { success: true, commitHash: 'def', message: 'OK' });
    const result = await useSyncStore.getState().startSync();
    const state = useSyncStore.getState();
    expect(result).toEqual({ success: true, unchanged: undefined });
    expect(state.lastSyncedCommit).toBe('def');
    expect(state.isSyncing).toBe(false);
    expect(state.error).toBeNull();
    expect(toastCallState.method).toBe('success');
  });

  test('startSync unchanged sync is silent (no toast) and flags unchanged', async () => {
    mockResponse('syncStart', {
      success: true,
      commitHash: 'def',
      message: 'Already up to date',
      unchanged: true,
    });
    const result = await useSyncStore.getState().startSync();
    expect(result).toEqual({ success: true, unchanged: true });
    expect(toastCallState.method).not.toBe('success');
  });

  test('startSync concurrent attempt is skipped without error toast', async () => {
    mockResponse('syncStart', {
      success: false,
      commitHash: '',
      message: 'Sync already in progress',
    });
    const result = await useSyncStore.getState().startSync();
    expect(result).toEqual({ success: false, skipped: true });
    expect(toastCallState.method).not.toBe('error');
    expect(useSyncStore.getState().error).toBeNull();
  });

  test('startSync failed sync', async () => {
    mockResponse('syncStart', { success: false, commitHash: '', message: 'Conflict' });
    await useSyncStore.getState().startSync();
    const state = useSyncStore.getState();
    expect(state.isSyncing).toBe(false);
    expect(state.error).toBe('Conflict');
  });

  test('startSync skips if already syncing', async () => {
    useSyncStore.setState({ isSyncing: true });
    deleteMock('syncStart');
    const result = await useSyncStore.getState().startSync();
    expect(result).toEqual({ success: false, skipped: true });
    expect(useSyncStore.getState().isSyncing).toBe(true);
  });

  test('startSync handles exception', async () => {
    const origError = console.error;
    const origWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    deleteMock('syncStart');
    const result = await useSyncStore.getState().startSync();
    expect(result.success).toBe(false);
    expect(useSyncStore.getState().isSyncing).toBe(false);
    expect(useSyncStore.getState().error).toBeTruthy();
    expect(toastCallState.method).toBe('error');
    console.error = origError;
    console.warn = origWarn;
  });

  test('setRepoURL sets URL and clears error', async () => {
    mockResponse('syncSetURL', { ok: true });
    await useSyncStore.getState().setRepoURL('https://github.com/user/new-repo');
    expect(useSyncStore.getState().remoteRepoURL).toBe('https://github.com/user/new-repo');
    expect(useSyncStore.getState().error).toBeNull();
  });

  test('setRepoURL handles error', async () => {
    const origError = console.error;
    const origWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    deleteMock('syncSetURL');
    await useSyncStore.getState().setRepoURL('https://invalid');
    expect(useSyncStore.getState().remoteRepoURL).toBe('');
    expect(useSyncStore.getState().error).toBeTruthy();
    console.error = origError;
    console.warn = origWarn;
  });
});
