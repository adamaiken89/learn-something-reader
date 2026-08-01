import { describe, expect, test } from 'bun:test';

import { sanitizeStorageData } from './schema';

describe('sanitizeStorageData', () => {
  test('returns structured defaults for missing keys', () => {
    const { data, dropped } = sanitizeStorageData({});
    expect(dropped).toBe(0);
    expect(data.highlights).toEqual([]);
    expect(data.notes).toEqual([]);
    expect(data.bookmarks).toEqual([]);
    expect(data.completedModules).toEqual([]);
    expect(data.studySessions).toEqual([]);
  });

  test('returns empty defaults for non-object input', () => {
    const { data, dropped } = sanitizeStorageData(null);
    expect(dropped).toBe(0);
    expect(data.studySessions).toEqual([]);
  });

  test('round-trips a fully populated structure', () => {
    const valid = {
      highlights: [
        {
          id: 'h1',
          courseID: 'math',
          moduleID: '01',
          selectedText: 'calculus',
          startOffset: 10,
          endOffset: 18,
          color: 'yellow',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      notes: [
        {
          id: 'n1',
          courseID: 'math',
          moduleID: '01',
          highlightID: 'h1',
          sectionID: 'sec-1',
          content: 'note body',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      bookmarks: [
        {
          id: 'b1',
          courseID: 'math',
          moduleID: '01',
          sectionID: null,
          title: 'bookmark title',
          scrollPosition: 42,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      completedModules: [{ courseID: 'math', moduleID: '01', completedAt: '2024-01-01' }],
      studySessions: [
        {
          date: '2024-01-01',
          courseID: 'math',
          moduleID: '01',
          durationMinutes: 30,
          type: 'reading',
        },
        {
          date: '2024-01-02',
          courseID: 'math',
          moduleID: '01',
          durationMinutes: 10,
          type: 'quiz',
          score: 4,
          total: 5,
        },
      ],
      quizSchedule: { 'math:01': { intervalDays: 3, nextDue: '2024-01-04' } },
      moduleSessions: {
        'math:01': {
          courseId: 'math',
          moduleId: '01',
          sectionId: 'sec-1',
          scrollPosition: 10,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    };
    const { data, dropped } = sanitizeStorageData(valid);
    expect(dropped).toBe(0);
    expect(data).toMatchObject(valid);
  });

  test('drops an invalid highlight record but keeps the rest', () => {
    const { data, dropped } = sanitizeStorageData({
      highlights: [
        {
          id: 'good',
          courseID: 'm',
          moduleID: '01',
          selectedText: 'x',
          startOffset: 0,
          endOffset: 1,
          color: 'yellow',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        { id: 'bad', courseID: 'm', moduleID: '01', selectedText: 'y', startOffset: 'nope' },
      ],
    });
    expect(dropped).toBe(1);
    expect(data.highlights).toHaveLength(1);
    expect(data.highlights[0].id).toBe('good');
  });

  test('drops invalid study session enum and non-number duration', () => {
    const { data, dropped } = sanitizeStorageData({
      studySessions: [
        { date: '2024-01-01', courseID: 'm', moduleID: '01', durationMinutes: 10, type: 'nope' },
        { date: '2024-01-01', courseID: 'm', moduleID: '01', durationMinutes: '10' },
        {
          date: '2024-01-01',
          courseID: 'm',
          moduleID: '01',
          durationMinutes: 10,
          type: 'quiz',
          score: 'x',
        },
      ],
    });
    expect(dropped).toBe(3);
    expect(data.studySessions).toEqual([]);
  });

  test('drops individual bad records in maps', () => {
    const { data, dropped } = sanitizeStorageData({
      quizSchedule: {
        'm:01': { intervalDays: 3, nextDue: '2024-01-04' },
        'm:02': { intervalDays: 'x' },
      },
      moduleSessions: {
        'm:01': {
          courseId: 'm',
          moduleId: '01',
          sectionId: 's',
          scrollPosition: 0,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });
    expect(dropped).toBe(1);
    expect(data.quizSchedule).toEqual({ 'm:01': { intervalDays: 3, nextDue: '2024-01-04' } });
    expect(data.moduleSessions).toHaveProperty('m:01');
  });

  test('rejects entire map when not an object', () => {
    const { data, dropped } = sanitizeStorageData({ quizSchedule: 'broken' });
    expect(dropped).toBe(1);
    expect(data.quizSchedule).toBeUndefined();
  });

  test('rejects non-array collection', () => {
    const { data, dropped } = sanitizeStorageData({ notes: 'not-an-array' });
    expect(dropped).toBe(1);
    expect(data.notes).toEqual([]);
  });

  test('accepts optional string-or-null sync fields', () => {
    const { data, dropped } = sanitizeStorageData({
      remoteRepoURL: 'https://example.com/repo',
      lastSyncedCommit: null,
      lastSyncTime: null,
    });
    expect(dropped).toBe(0);
    expect(data.remoteRepoURL).toBe('https://example.com/repo');
    expect(data.lastSyncedCommit).toBeNull();
    expect(data.lastSyncTime).toBeNull();
  });

  test('drops invalid remoteRepoURL type', () => {
    const { data, dropped } = sanitizeStorageData({ remoteRepoURL: 42 });
    expect(dropped).toBe(1);
    expect(data.remoteRepoURL).toBeUndefined();
  });

  test('preserves unknown extra keys', () => {
    const { data, dropped } = sanitizeStorageData({ futureField: 'keep-me' });
    expect(dropped).toBe(0);
    expect((data as unknown as Record<string, unknown>).futureField).toBe('keep-me');
  });

  test('accepts a numeric version field and rejects non-numeric', () => {
    const ok = sanitizeStorageData({ version: 2 });
    expect(ok.dropped).toBe(0);
    expect((ok.data as unknown as Record<string, unknown>).version).toBe(2);
    const bad = sanitizeStorageData({ version: 'two' });
    expect(bad.dropped).toBe(1);
  });
});
