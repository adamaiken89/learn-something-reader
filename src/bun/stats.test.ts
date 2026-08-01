import { describe, expect, test, beforeEach } from 'bun:test';

import { fsMockImpl } from '../testFsShared';
import { invalidateCache, load } from './persistence';

const mockSyllabi: Record<string, string> = {};
const mockDirEntries: Array<{ name: string; isDirectory: () => boolean; isFile?: () => boolean }> =
  [];

let storageData: Record<string, unknown> = {};

function addCourse(courseId: string, courseName: string, moduleNames: string[]) {
  let yaml = `subject: ${courseName}\nmodules:\n`;
  for (let i = 0; i < moduleNames.length; i++) {
    const mid = `${String(i + 1).padStart(2, '0')}`;
    yaml += `  - id: "${mid}"\n    name: ${moduleNames[i]}\n    time_hours: 1\n    prerequisites: []\n    topics: []\n`;
  }
  mockSyllabi[courseId] = yaml;
  mockDirEntries.push({ name: courseId, isDirectory: () => true });
}

type Stats = typeof import('./stats');
let stats: Stats;

beforeEach(() => {
  invalidateCache();
  for (const k of Object.keys(mockSyllabi)) delete mockSyllabi[k];
  mockDirEntries.length = 0;
  storageData = {
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
  };

  Object.assign(fsMockImpl, {
    existsSync: () => true,
    readdirSync: () => mockDirEntries,
    readFileSync: (p: string) => {
      if (p.includes('data.json')) return JSON.stringify(storageData);
      if (p.includes('deck.json')) return JSON.stringify({ cards: {} });
      const syllabusMatch = p.match(/\/([^/]+)\/syllabus\.yaml$/);
      if (syllabusMatch && syllabusMatch[1] in mockSyllabi) {
        return mockSyllabi[syllabusMatch[1]];
      }
      return '';
    },
    writeFileSync: () => {},
    mkdirSync: () => {},
    rmSync: () => {},
    cpSync: () => {},
  });
});

describe('getCourseStats', () => {
  test('returns stats for valid course', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', ['Intro']);
    const result = stats.getCourseStats('math');
    expect(result.courseID).toBe('math');
    expect(result.totalModules).toBe(1);
  });

  test('throws for nonexistent course', async () => {
    stats = await import('./stats');
    expect(() => stats.getCourseStats('nonexistent')).toThrow('Course nonexistent not found');
  });

  test('computes avgQuizScore from quiz sessions', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    storageData.studySessions = [
      {
        date: yesterday.toISOString(),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 10,
        type: 'quiz',
        score: 4,
        total: 5,
      },
      {
        date: today.toISOString(),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 10,
        type: 'quiz',
        score: 3,
        total: 5,
      },
    ];
    const result = stats.getCourseStats('math');
    expect(result.quizAttempts).toBe(2);
    expect(result.avgQuizScore).toBe(70);
  });

  test('returns 0 avgQuizScore when no quiz sessions', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    const result = stats.getCourseStats('math');
    expect(result.avgQuizScore).toBe(0);
    expect(result.quizAttempts).toBe(0);
  });

  test('computes totalStudyMinutes from sessions', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    storageData.studySessions = [
      {
        date: yesterday.toISOString(),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 30,
        type: 'reading',
      },
      {
        date: today.toISOString(),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 15,
        type: 'reading',
      },
    ];
    const result = stats.getCourseStats('math');
    expect(result.totalStudyMinutes).toBe(45);
  });
});

describe('getGlobalStats', () => {
  test('returns global stats across courses', async () => {
    stats = await import('./stats');
    addCourse('math', 'Mathematics', ['A', 'B']);
    addCourse('physics', 'Physics', ['C']);
    storageData.completedModules = [
      { courseID: 'math', moduleID: '01', completedAt: '2024-01-01' },
    ];
    const today = new Date();
    storageData.studySessions = [
      {
        date: today.toISOString(),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 30,
        type: 'reading',
      },
    ];
    const result = stats.getGlobalStats();
    expect(result.totalCourses).toBe(2);
    expect(result.totalModules).toBe(3);
    expect(result.totalCompletedModules).toBe(1);
    expect(result.totalStudyMinutes).toBe(30);
    expect(result.courseSummaries).toHaveLength(2);
    expect(result.courseSummaries[0]).toMatchObject({ courseID: 'math', completed: 1, total: 2 });
  });

  test('returns empty summaries when no courses', async () => {
    stats = await import('./stats');
    const result = stats.getGlobalStats();
    expect(result.totalCourses).toBe(0);
    expect(result.courseSummaries).toEqual([]);
  });
});

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

describe('nextIntervalDays', () => {
  test('escalates ladder on pass', async () => {
    stats = await import('./stats');
    expect(stats.nextIntervalDays(null, true)).toBe(3);
    expect(stats.nextIntervalDays(3, true)).toBe(7);
    expect(stats.nextIntervalDays(7, true)).toBe(14);
    expect(stats.nextIntervalDays(14, true)).toBe(30);
    expect(stats.nextIntervalDays(30, true)).toBe(30);
  });

  test('resets to rung 1 on fail, preserves unknown intervals', async () => {
    stats = await import('./stats');
    expect(stats.nextIntervalDays(14, false)).toBe(3);
    expect(stats.nextIntervalDays(99, true)).toBe(99);
  });
});

describe('recordQuizResult', () => {
  test('writes schedule and escalates interval on repeated passes', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    storageData.studySessions = [
      {
        date: dateStr(1),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 9,
        total: 10,
      },
    ];
    stats.recordQuizResult('math', '01', 9, 10);
    const first = load();
    expect(first.quizSchedule?.['math:01']).toEqual({
      intervalDays: 3,
      nextDue: dateStr(1 - 3),
    });
    (load().studySessions as Array<{ date: string }>)[0].date = dateStr(0);
    stats.recordQuizResult('math', '01', 9, 10);
    const second = load();
    expect(second.quizSchedule?.['math:01']).toEqual({
      intervalDays: 7,
      nextDue: dateStr(0 - 7),
    });
  });

  test('resets to rung 1 on fail', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    storageData.studySessions = [
      {
        date: dateStr(1),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 9,
        total: 10,
      },
    ];
    stats.recordQuizResult('math', '01', 9, 10);
    (load().studySessions as Array<{ date: string }>)[0].date = dateStr(0);
    stats.recordQuizResult('math', '01', 2, 10);
    const data = load();
    expect(data.quizSchedule?.['math:01']).toEqual({
      intervalDays: 3,
      nextDue: dateStr(0 - 3),
    });
  });

  test('unknown schedules start at rung 1', async () => {
    stats = await import('./stats');
    addCourse('math', 'Math', []);
    storageData.studySessions = [
      {
        date: dateStr(0),
        courseID: 'math',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 9,
        total: 10,
      },
    ];
    stats.recordQuizResult('math', '01', 9, 10);
    expect(load().quizSchedule?.['math:01']).toEqual({
      intervalDays: 3,
      nextDue: dateStr(0 - 3),
    });
  });
});

describe('getQuizStatus scheduling', () => {
  function mockCourseWithMcq(courseId: string) {
    addCourse(courseId, courseId, []);
    Object.assign(fsMockImpl, {
      readdirSync: (p: string) => {
        if (p.includes('modules')) return [{ name: '01-intro', isDirectory: (): boolean => true }];
        return mockDirEntries.map((e) => ({ ...e, isFile: () => false }));
      },
    });
  }

  test('schedules derived from last attempt — ready today', async () => {
    stats = await import('./stats');
    mockCourseWithMcq('sched');
    const completedAt = `${dateStr(20)}T10:00:00.000Z`;
    storageData.completedModules = [{ courseID: 'sched', moduleID: '01', completedAt }];
    storageData.studySessions = [
      {
        date: dateStr(3),
        courseID: 'sched',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 8,
        total: 10,
      },
    ];
    const status = stats.getQuizStatus('sched');
    expect(status.modules[0].attempt).toMatchObject({
      attempted: true,
      due: true,
      overdue: false,
      ready: true,
    });
  });

  test('overdue when nextDue in the past', async () => {
    stats = await import('./stats');
    mockCourseWithMcq('sched');
    storageData.completedModules = [
      { courseID: 'sched', moduleID: '01', completedAt: `${dateStr(20)}T10:00:00.000Z` },
    ];
    storageData.studySessions = [
      {
        date: dateStr(10),
        courseID: 'sched',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 8,
        total: 10,
      },
    ];
    const status = stats.getQuizStatus('sched');
    expect(status.modules[0].attempt).toMatchObject({ overdue: true, ready: false, due: true });
  });

  test('not due while within current interval', async () => {
    stats = await import('./stats');
    mockCourseWithMcq('sched');
    storageData.completedModules = [
      { courseID: 'sched', moduleID: '01', completedAt: `${dateStr(20)}T10:00:00.000Z` },
    ];
    storageData.studySessions = [
      {
        date: dateStr(1),
        courseID: 'sched',
        moduleID: '01',
        durationMinutes: 5,
        type: 'quiz',
        score: 8,
        total: 10,
      },
    ];
    const status = stats.getQuizStatus('sched');
    expect(status.modules[0].attempt).toMatchObject({ overdue: false, ready: false, due: false });
  });

  test('unattempted completed lesson becomes overdue after seed interval', async () => {
    stats = await import('./stats');
    mockCourseWithMcq('sched');
    storageData.completedModules = [
      { courseID: 'sched', moduleID: '01', completedAt: `${dateStr(10)}T10:00:00.000Z` },
    ];
    const status = stats.getQuizStatus('sched');
    expect(status.modules[0].attempt).toMatchObject({
      attempted: false,
      overdue: true,
      ready: false,
      due: true,
    });
  });

  test('unattempted completed lesson not due before 3 days', async () => {
    stats = await import('./stats');
    mockCourseWithMcq('sched');
    storageData.completedModules = [
      { courseID: 'sched', moduleID: '01', completedAt: `${dateStr(1)}T10:00:00.000Z` },
    ];
    const status = stats.getQuizStatus('sched');
    expect(status.modules[0].attempt).toBeNull();
  });
});
