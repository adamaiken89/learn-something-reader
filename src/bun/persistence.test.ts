import { describe, expect, test, beforeEach, spyOn } from 'bun:test';

import { fsMockImpl } from '../testFsShared';
import { invalidateCache, load, save, clearAllData } from './persistence';
import type { StorageData } from './types';

let storageData: Record<string, unknown> = {};
let rawFileContent: string | null = null;
let readFileShouldThrow = false;
const writtenFiles: Array<{ path: string; data: string }> = [];

function fullStorage(): StorageData {
  return {
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
    ...storageData,
  };
}

beforeEach(() => {
  invalidateCache();
  storageData = {};
  rawFileContent = null;
  readFileShouldThrow = false;
  writtenFiles.length = 0;

  Object.assign(fsMockImpl, {
    existsSync: () => true,
    readFileSync: (p: string) => {
      if (readFileShouldThrow) throw new Error('EACCES: permission denied');
      if (p.includes('data.json')) {
        return rawFileContent ?? JSON.stringify(fullStorage());
      }
      return '';
    },
    writeFileSync: (p: string, data: string) => {
      writtenFiles.push({ path: p, data });
    },
    mkdirSync: () => {},
  });
});

describe('load', () => {
  test('returns empty storage when file missing', () => {
    Object.assign(fsMockImpl, { existsSync: () => false });
    const data = load();
    expect(data.highlights).toEqual([]);
    expect(data.notes).toEqual([]);
    expect(data.bookmarks).toEqual([]);
    expect(data.completedModules).toEqual([]);
    expect(data.studySessions).toEqual([]);
  });

  test('returns parsed and sanitized records', () => {
    rawFileContent = JSON.stringify({
      highlights: [
        {
          id: 'h1',
          courseID: 'math',
          moduleID: '01',
          selectedText: 'x',
          startOffset: 0,
          endOffset: 1,
          color: 'yellow',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    });
    const data = load();
    expect(data.highlights).toHaveLength(1);
    expect(data.highlights[0].id).toBe('h1');
  });

  test('repairs invalid records individually and keeps valid ones', () => {
    rawFileContent = JSON.stringify({
      notes: [
        {
          id: 'good',
          courseID: 'math',
          moduleID: '01',
          highlightID: null,
          sectionID: null,
          content: 'ok',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        { id: 'bad', courseID: 42 },
      ],
    });
    const data = load();
    expect(data.notes).toHaveLength(1);
    expect(data.notes[0].id).toBe('good');
  });

  test('backs up corrupt file and returns defaults', () => {
    rawFileContent = '{not valid json';
    const warnSpy = spyOn(require('./logger').logger, 'warn');
    const data = load();
    expect(data.studySessions).toEqual([]);
    expect(writtenFiles.length).toBe(1);
    expect(writtenFiles[0].path.includes('data.json.bak-')).toBe(true);
    expect(writtenFiles[0].data).toBe('{not valid json');
    expect(warnSpy.mock.calls[0][1]).toContain('backed up');
    warnSpy.mockRestore();
  });

  test('returns defaults without backup when read fails', () => {
    readFileShouldThrow = true;
    const warnSpy = spyOn(require('./logger').logger, 'warn');
    const data = load();
    expect(data.completedModules).toEqual([]);
    expect(writtenFiles.length).toBe(0);
    expect(warnSpy.mock.calls[0][1]).toContain('Failed to read');
    warnSpy.mockRestore();
  });

  test('caches after first read', () => {
    let reads = 0;
    Object.assign(fsMockImpl, {
      readFileSync: (p: string) => {
        if (p.includes('data.json')) {
          reads++;
          return JSON.stringify(fullStorage());
        }
        return '';
      },
    });
    load();
    load();
    load();
    expect(reads).toBe(1);
  });

  test('re-reads after invalidateCache', () => {
    let reads = 0;
    Object.assign(fsMockImpl, {
      readFileSync: (p: string) => {
        if (p.includes('data.json')) {
          reads++;
          return JSON.stringify(fullStorage());
        }
        return '';
      },
    });
    load();
    invalidateCache();
    load();
    expect(reads).toBe(2);
  });
});

describe('save', () => {
  test('writes pretty JSON to data.json and caches', () => {
    const data = fullStorage();
    data.completedModules.push({
      courseID: 'math',
      moduleID: '02',
      completedAt: '2026-08-25T10:00:00Z',
    });
    save(data);
    expect(writtenFiles.length).toBe(1);
    expect(writtenFiles[0].path.includes('.coursereader')).toBe(true);
    expect(writtenFiles[0].path.endsWith('data.json')).toBe(true);
    expect(JSON.parse(writtenFiles[0].data).completedModules).toHaveLength(1);
    // cached: subsequent load must not re-read
    let reads = 0;
    Object.assign(fsMockImpl, {
      readFileSync: () => {
        reads++;
        return '{}';
      },
    });
    const loaded = load();
    expect(reads).toBe(0);
    expect(loaded.completedModules).toHaveLength(1);
  });
});

describe('clearAllData', () => {
  test('writes empty collections', () => {
    clearAllData();
    expect(writtenFiles.length).toBe(1);
    const parsed = JSON.parse(writtenFiles[0].data);
    expect(parsed.highlights).toEqual([]);
    expect(parsed.notes).toEqual([]);
    expect(parsed.bookmarks).toEqual([]);
    expect(parsed.completedModules).toEqual([]);
    expect(parsed.studySessions).toEqual([]);
  });
});
