import { describe, expect, test, beforeEach } from 'bun:test';

import { fsMockImpl } from '../testFsShared';
import { invalidateCache } from './persistence';
import * as progress from './persistence-progress';
import type { StorageData } from './types';

let storageData: StorageData;

let written: Array<{ path: string; data: string }> = [];

beforeEach(() => {
  invalidateCache();
  storageData = {
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
  };
  written = [];
  Object.assign(fsMockImpl, {
    existsSync: () => true,
    readFileSync: (p: string) => {
      if (p.includes('data.json')) return JSON.stringify(storageData);
      return '';
    },
    writeFileSync: (p: string, data: string) => {
      written.push({ path: p, data });
      storageData = JSON.parse(data);
    },
    mkdirSync: () => {},
  });
});

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

describe('module completion', () => {
  test('toggle adds then removes completion', () => {
    expect(progress.toggleModuleCompleted('math', '01')).toBe(true);
    expect(progress.isModuleCompleted('math', '01')).toBe(true);
    expect(storageData.completedModules[0].completedAt).toBeTruthy();
    expect(progress.toggleModuleCompleted('math', '01')).toBe(false);
    expect(progress.isModuleCompleted('math', '01')).toBe(false);
    expect(progress.getCompletedModuleCount('math')).toBe(0);
  });

  test('getters filter by course', () => {
    progress.toggleModuleCompleted('math', '01');
    progress.toggleModuleCompleted('math', '02');
    progress.toggleModuleCompleted('physics', '01');
    expect(progress.getCompletedModuleIDs('math')).toEqual(['01', '02']);
    expect(progress.getCompletedModuleCount('physics')).toBe(1);
    expect(progress.getCompletedModuleCount('none')).toBe(0);
    expect(progress.getModuleCompletedAt('math', '01')).toBeTruthy();
    expect(progress.getModuleCompletedAt('math', '99')).toBeNull();
  });
});

describe('study sessions', () => {
  test('addStudySession defaults date to today', () => {
    const s = progress.addStudySession({
      courseID: 'math',
      moduleID: '01',
      durationMinutes: 10,
      type: 'reading',
    });
    expect(s.date).toBe(dayOffset(0));
    expect(storageData.studySessions).toHaveLength(1);
  });

  test('addStudySession preserves explicit date', () => {
    const s = progress.addStudySession({
      courseID: 'math',
      moduleID: '01',
      durationMinutes: 10,
      type: 'reading',
      date: '2026-01-15',
    });
    expect(s.date).toBe('2026-01-15');
  });

  test('getLastQuizSession filters quiz type and sorts desc', () => {
    storageData.studySessions = [
      { date: '2026-01-01', courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'quiz' },
      { date: '2026-03-01', courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'quiz' },
      { date: '2026-04-01', courseID: 'm', moduleID: '02', durationMinutes: 5, type: 'quiz' },
      { date: '2026-05-01', courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
    ];
    invalidateCache();
    const last = progress.getLastQuizSession('m', '01');
    expect(last?.date).toBe('2026-03-01');
    expect(progress.getLastQuizSession('m', '99')).toBeNull();
  });

  test('getStudySessions filters by days and sorts desc', () => {
    storageData.studySessions = [
      { date: dayOffset(-40), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(-2), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(-1), courseID: 'm', moduleID: '02', durationMinutes: 5, type: 'quiz' },
      {
        date: dayOffset(-30),
        courseID: 'other',
        moduleID: '01',
        durationMinutes: 5,
        type: 'reading',
      },
    ];
    invalidateCache();
    expect(progress.getStudySessions('m')).toHaveLength(3);
    expect(progress.getStudySessions('m').map((s) => s.moduleID)).toEqual(['02', '01', '01']);
    expect(progress.getStudySessions('m', 7)).toHaveLength(2);
    expect(progress.getGlobalStudySessions(7)).toHaveLength(2);
    expect(progress.getGlobalStudySessions()).toHaveLength(4);
  });
});

describe('getDailyStreak', () => {
  test('returns 0 with no sessions', () => {
    expect(progress.getDailyStreak()).toBe(0);
  });

  test('today only counts as streak of 1', () => {
    storageData.studySessions = [
      { date: dayOffset(0), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
    ];
    invalidateCache();
    expect(progress.getDailyStreak()).toBe(1);
  });

  test('consecutive days chain', () => {
    storageData.studySessions = [
      { date: dayOffset(-2), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(-1), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(0), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
    ];
    invalidateCache();
    expect(progress.getDailyStreak()).toBe(3);
  });

  test('gap breaks streak but keeps recent run', () => {
    storageData.studySessions = [
      { date: dayOffset(-10), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(-1), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(0), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
    ];
    invalidateCache();
    expect(progress.getDailyStreak()).toBe(2);
  });

  test('stale dates return 0', () => {
    storageData.studySessions = [
      { date: dayOffset(-30), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
    ];
    invalidateCache();
    expect(progress.getDailyStreak()).toBe(0);
  });

  test('multiple sessions same day count once', () => {
    storageData.studySessions = [
      { date: dayOffset(0), courseID: 'm', moduleID: '01', durationMinutes: 5, type: 'reading' },
      { date: dayOffset(0), courseID: 'm', moduleID: '02', durationMinutes: 5, type: 'quiz' },
    ];
    invalidateCache();
    expect(progress.getDailyStreak()).toBe(1);
  });
});

describe('sync config', () => {
  test('defaults when unset', () => {
    expect(progress.getSyncConfig()).toEqual({
      remoteRepoURL: '',
      lastSyncedCommit: null,
      lastSyncTime: null,
    });
  });

  test('partial update preserves other fields', () => {
    progress.saveSyncConfig({ remoteRepoURL: 'https://github.com/x/y' });
    progress.saveSyncConfig({ lastSyncedCommit: 'abc123' });
    const cfg = progress.getSyncConfig();
    expect(cfg.remoteRepoURL).toBe('https://github.com/x/y');
    expect(cfg.lastSyncedCommit).toBe('abc123');
    expect(cfg.lastSyncTime).toBeNull();
  });
});

describe('last session', () => {
  const session = {
    course: {
      id: 'math',
      course: 'Math',
      timeBudgetHours: 1,
      targetLevel: 'beginner',
      domain: 'math',
      prerequisites: [],
      learningObjectives: [],
      modules: [],
      displayName: 'Math',
    },
    module: { id: '01', name: 'Intro', timeHours: 1, prerequisites: [], topics: [] },
    sectionId: 's1',
    scrollPosition: 100,
    updatedAt: '2026-08-25T00:00:00Z',
  };

  test('set/get/clear round trip', () => {
    expect(progress.getLastSession()).toBeNull();
    progress.setLastSession(session);
    expect(progress.getLastSession()?.sectionId).toBe('s1');
    progress.clearLastSession();
    expect(progress.getLastSession()).toBeNull();
  });
});

describe('module sessions', () => {
  test('get returns null when missing', () => {
    expect(progress.getModuleSession('math', '01')).toBeNull();
    expect(progress.getCourseModuleSessions('math')).toEqual([]);
  });

  test('set and get keyed by course:module', () => {
    progress.setModuleSession({
      courseId: 'math',
      moduleId: '01',
      sectionId: 's1',
      scrollPosition: 50,
      updatedAt: '2026-08-24T00:00:00Z',
    });
    expect(progress.getModuleSession('math', '01')?.sectionId).toBe('s1');
    expect(progress.getModuleSession('math', '02')).toBeNull();
  });

  test('getCourseModuleSessions sorts by updatedAt desc', () => {
    progress.setModuleSession({
      courseId: 'math',
      moduleId: '01',
      sectionId: 'old',
      scrollPosition: 0,
      updatedAt: '2026-08-20T00:00:00Z',
    });
    progress.setModuleSession({
      courseId: 'math',
      moduleId: '02',
      sectionId: 'new',
      scrollPosition: 0,
      updatedAt: '2026-08-25T00:00:00Z',
    });
    progress.setModuleSession({
      courseId: 'other',
      moduleId: '01',
      sectionId: 'elsewhere',
      scrollPosition: 0,
      updatedAt: '2026-08-26T00:00:00Z',
    });
    const sessions = progress.getCourseModuleSessions('math');
    expect(sessions.map((s) => s.sectionId)).toEqual(['new', 'old']);
  });
});
