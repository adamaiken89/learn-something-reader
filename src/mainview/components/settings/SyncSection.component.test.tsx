import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { useCourseStore } from '../../stores/courseStore';
import { useSyncStore } from '../../stores/syncStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import SyncSection from './SyncSection';

setupRPC();

function seedSync(overrides: Partial<Parameters<typeof useSyncStore.setState>[0]> = {}) {
  const store = useSyncStore.getState();
  useSyncStore.setState({
    lastSyncTime: null,
    lastSyncedCommit: null,
    isSyncing: false,
    remoteRepoURL: '',
    error: null,
    startSync: store.startSync,
    setRepoURL: store.setRepoURL,
    ...overrides,
  });
}

describe('SyncSection', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    clearMocks();
    seedSync();
    useCourseStore.setState({ courses: [], loading: false, error: null, loaded: true });
  });

  async function renderSection() {
    let container: HTMLElement;
    await act(async () => {
      container = render(<SyncSection />).container;
    });
    return container!;
  }

  function queryInput(container: HTMLElement) {
    return container.querySelector('input[type="text"]') as HTMLInputElement;
  }

  test('renders repo input empty without stored URL', async () => {
    const container = await renderSection();
    expect(queryInput(container).value).toBe('');
  });

  test('pre-fills input from stored remote URL', async () => {
    seedSync({ remoteRepoURL: 'https://github.com/me/repo' });
    const container = await renderSection();
    expect(queryInput(container).value).toBe('https://github.com/me/repo');
  });

  test('paste button fills input from clipboard', async () => {
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { readText: mock(async () => 'https://past.ed/url') },
    });
    const container = await renderSection();
    await user.click(container.querySelector('button[title]')!);
    await waitFor(() => {
      expect(queryInput(container).value).toBe('https://past.ed/url');
    });
  });

  test('copy button writes current input to clipboard', async () => {
    const writeText = mock(async () => {});
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { readText: mock(async () => ''), writeText },
    });
    const container = await renderSection();
    await user.type(queryInput(container), 'https://x.co/c');
    const buttons = Array.from(container.querySelectorAll('button'));
    const copyBtn = buttons.find((b) => b.textContent === 'Copy')!;
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith('https://x.co/c');
  });

  test('save button persists trimmed URL and flashes Saved label', async () => {
    const setRepoURL = mock(async () => {});
    seedSync({ setRepoURL: setRepoURL as unknown as (url: string) => Promise<void> });
    const container = await renderSection();
    await user.type(queryInput(container), '  https://x.co/s  ');
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Save URL',
    )!;
    await user.click(saveBtn);
    expect(setRepoURL).toHaveBeenCalledWith('https://x.co/s');
    await waitFor(() => {
      expect(saveBtn.textContent).toContain('Saved');
    });
  });

  test('sync button disabled until a remote repo URL is saved', async () => {
    const container = await renderSection();
    const syncBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Sync Now',
    )!;
    expect((syncBtn as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      seedSync({ remoteRepoURL: 'https://x.co/r' });
    });
    await waitFor(() => {
      expect((syncBtn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  test('sync now calls startSync and reloads courses on success', async () => {
    mockResponse('coursesList', []);
    let resetCalled = false;
    const courseStoreState = useCourseStore.getState();
    useCourseStore.setState({
      ...courseStoreState,
      reset: () => {
        resetCalled = true;
      },
    });
    let syncForce: boolean | undefined;
    seedSync({
      remoteRepoURL: 'https://x.co/r',
      startSync: mock(async (force?: boolean) => {
        syncForce = force;
        return { success: true };
      }) as never,
    });
    const container = await renderSection();
    const syncBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Sync Now',
    )!;
    await user.click(syncBtn);
    expect(syncForce).toBeUndefined();
    await waitFor(() => expect(resetCalled).toBe(true));
  });

  test('force checkbox passes force flag to startSync', async () => {
    let syncForce: boolean | undefined;
    seedSync({
      remoteRepoURL: 'https://x.co/r',
      startSync: mock(async (force?: boolean) => {
        syncForce = force;
        return { success: false };
      }) as never,
    });
    const container = await renderSection();
    await user.click(container.querySelector('input[type="checkbox"]')!);
    const syncBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Sync Now',
    )!;
    await user.click(syncBtn);
    expect(syncForce).toBe(true);
  });

  test('shows last synced time and short commit hash', async () => {
    seedSync({
      lastSyncTime: new Date('2025-01-15T10:30:00Z').toISOString(),
      lastSyncedCommit: 'abcdef1234567890',
    });
    const container = await renderSection();
    expect(container.textContent).toContain('Last synced');
    expect(container.textContent).toContain('abcdef1');
    expect(container.textContent).not.toContain('abcdef12');
  });

  test('shows sync error message', async () => {
    seedSync({ error: 'network exploded' });
    const container = await renderSection();
    expect(container.textContent).toContain('network exploded');
  });
});
