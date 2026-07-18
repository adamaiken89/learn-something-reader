import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { fsMockImpl, mockExecSyncImpl } from '../testFsShared';
import { invalidateCache } from './persistence';
import * as utilsModule from './utils';

const mockExistsSync = mock<(p: string) => boolean>();
const mockMkdirSync = mock<(p: string, opts?: unknown) => void>();
const mockReadFileSync = mock<(p: string, enc?: string) => string>();
const mockWriteFileSync = mock<(p: string, data: string) => void>();
const mockReaddirSync =
  mock<(p: string, opts?: unknown) => Array<{ name: string; isDirectory: () => boolean }>>();
const mockRmSync = mock<(p: string, opts?: unknown) => void>();
const mockRenameSync = mock<(oldP: string, newP: string) => void>();

let storageData: Record<string, unknown> = {};
let mockSubjectsDir = '';

type Sync = typeof import('./sync');
let sync: Sync;

function makeDirEntry(name: string, isDir: boolean = true) {
  return { name, isDirectory: () => isDir };
}

beforeEach(() => {
  invalidateCache();
  storageData = {};
  mockSubjectsDir = '';

  mockExecSyncImpl.fn = mock((_cmd: string) => Buffer.from(''));

  mockExistsSync.mockReset();
  mockMkdirSync.mockReset();
  mockReadFileSync.mockReset();
  mockWriteFileSync.mockReset();
  mockReaddirSync.mockReset();
  mockRmSync.mockReset();
  mockRenameSync.mockReset();
  Object.assign(fsMockImpl, {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    readdirSync: mockReaddirSync,
    rmSync: mockRmSync,
    renameSync: mockRenameSync,
  });

  // Default: all paths exist except syllabus.yaml (no courses by default)
  mockExistsSync.mockImplementation((p: string) => {
    if (p.includes('data.json')) return true;
    if (p.includes('syllabus.yaml')) return false;
    return true;
  });
  mockReadFileSync.mockImplementation((p: string, _enc?: string) =>
    p.includes('data.json') ? JSON.stringify(storageData) : '{}',
  );
  mockWriteFileSync.mockImplementation((p: string, data: string) => {
    if (p.includes('data.json')) Object.assign(storageData, JSON.parse(data));
  });
  mockMkdirSync.mockImplementation(() => {});
  mockReaddirSync.mockReturnValue([]);
  mockRmSync.mockImplementation(() => {});
  mockRenameSync.mockImplementation(() => {});
});

afterEach(() => {
  mockExecSyncImpl.fn = (_cmd: string) => Buffer.from('');
});

describe('isSyncing', () => {
  test('returns false initially', async () => {
    spyOn(utilsModule, 'findSubjectsDir').mockImplementation(() => '');
    sync = await import('./sync');
    expect(sync.isSyncing()).toBe(false);
  });
});

function setupSubjectsDir() {
  mockSubjectsDir = '/tmp/subjects';
  spyOn(utilsModule, 'findSubjectsDir').mockImplementation(() => mockSubjectsDir);
}

function setupFetch(sha: string) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ sha }),
    } as Response),
  ) as unknown as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

/** Set up mocks so the sync clone passes validation (has syllabus.yaml) */
function setupSuccessfulClone(courseNames: string[]) {
  mockExistsSync.mockImplementation((p: string) => {
    if (p.includes('data.json')) return true;
    return true; // Everything exists (subjects, tmp-sync, syllabus.yaml, etc.)
  });
  mockReaddirSync.mockReturnValue(courseNames.map((n) => makeDirEntry(n)));
}

describe('syncCourses', () => {
  test('returns error when no repo configured', async () => {
    setupSubjectsDir();
    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toBe('No remote repository configured');
  });

  test('returns up-to-date when same commit and courses exist', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo', lastSyncedCommit: 'abc123' };
    setupSubjectsDir();
    const restore = setupFetch('abc123');
    setupSuccessfulClone(['math']);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);
    expect(result.unchanged).toBe(true);
    expect(result.message).toBe('Already up to date');

    restore();
  });

  test('force flag bypasses up-to-date check', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo', lastSyncedCommit: 'abc123' };
    setupSubjectsDir();
    const restore = setupFetch('abc123');
    setupSuccessfulClone(['math', 'physics']);

    sync = await import('./sync');
    const result = await sync.syncCourses(true);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Synced');
    expect(result.message).toContain('2');

    restore();
  });

  test('auto-forces when subjects dir has no valid courses', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo', lastSyncedCommit: 'abc123' };
    setupSubjectsDir();
    const restore = setupFetch('abc123');

    // Subjects dir syllabus → false (no courses locally)
    // Tmp-sync syllabus → true (courses available remotely)
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('data.json')) return true;
      if (p.includes('syllabus.yaml') && p.includes('subjects')) return false;
      if (p.includes('syllabus.yaml')) return true;
      return true;
    });
    mockReaddirSync.mockReturnValue([makeDirEntry('math')]);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Synced');

    restore();
  });

  test('returns error on invalid repo URL format', async () => {
    storageData = { remoteRepoURL: 'https://gitlab.com/owner/repo' };
    setupSubjectsDir();

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid GitHub URL format');
  });

  test('returns error when courses dir not found', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo', lastSyncedCommit: 'oldhash' };
    mockSubjectsDir = '';

    spyOn(utilsModule, 'findSubjectsDir').mockImplementation(() => '');

    const restore = setupFetch('newhash');

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Courses directory not found');

    restore();
  });

  test('rejects clone with no syllabus.yaml', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();
    const restore = setupFetch('newhash');

    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('data.json')) return true;
      if (p.includes('syllabus.yaml')) return false;
      return true;
    });
    mockReaddirSync.mockReturnValue([makeDirEntry('not-a-course')]);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toContain('No valid course directories found');

    restore();
  });

  test('handles GitHub API failure', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 403,
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toContain('GitHub API error');
    expect(result.message).toContain('403');

    globalThis.fetch = originalFetch;
  });

  test('full sync success saves config and cleans up', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();
    const restore = setupFetch('newhash123');
    setupSuccessfulClone(['math', 'physics']);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);
    expect(result.commitHash).toBe('newhash123');
    expect(result.message).toContain('Synced 2 courses');
    expect(mockRmSync).toHaveBeenCalledWith(
      expect.stringContaining('subjects-bak'),
      expect.anything(),
    );

    restore();
  });

  test('full sync preserves SRS decks from backup', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();
    const restore = setupFetch('newhash456');

    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('deck.json')) return true;
      return true;
    });
    mockReadFileSync.mockImplementation((p: string) =>
      p.includes('deck.json')
        ? '{"cards":{"c1":{}}}'
        : p.includes('data.json')
          ? JSON.stringify(storageData)
          : '{}',
    );
    mockReaddirSync.mockReturnValue([makeDirEntry('math')]);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('deck.json'),
      '{"cards":{"c1":{}}}',
    );

    restore();
  });

  test('getLatestRemoteCommit with trailing .git', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo.git' };
    setupSubjectsDir();
    const restore = setupFetch('newhash');
    setupSuccessfulClone(['math']);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);

    restore();
  });

  test('falls back to master branch when main returns 404', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();

    let callCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sha: 'master-sha' }),
      } as Response);
    }) as unknown as typeof globalThis.fetch;

    setupSuccessfulClone(['math']);

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(true);
    expect(callCount).toBe(2);

    globalThis.fetch = originalFetch;
  });

  test('handles sync failure during clone', async () => {
    storageData = { remoteRepoURL: 'https://github.com/owner/repo' };
    setupSubjectsDir();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sha: 'newhash' }),
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    mockExecSyncImpl.fn = mock((_cmd: string) => {
      throw new Error('Clone failed');
    });

    sync = await import('./sync');
    const result = await sync.syncCourses();
    expect(result.success).toBe(false);
    expect(result.message).toContain('Clone failed');

    globalThis.fetch = originalFetch;
  });
});
