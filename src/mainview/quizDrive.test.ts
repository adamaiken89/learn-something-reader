import { describe, expect, test } from 'bun:test';

import type { CourseQuizStatus, QuizAttemptStatus } from '../bun/stats';
import type { Course, ModuleMeta, QuizIndex } from '../bun/types';
import {
  dueStateOf,
  dueTargets,
  nextQuizAfter,
  presenceFromIndex,
  targetAttempt,
  targetToView,
} from './quizDrive';

function makeModule(id: string, name: string): ModuleMeta {
  return { id, name, timeHours: 1, prerequisites: [], topics: [] };
}

function makeCourse(modules: ModuleMeta[]): Course {
  return {
    id: 'c1',
    course: 'Course',
    displayName: 'Course',
    timeBudgetHours: 10,
    targetLevel: 'beginner',
    domain: 'test',
    prerequisites: [],
    learningObjectives: [],
    modules,
  };
}

const module1 = makeModule('01', 'Intro');
const module2 = makeModule('02', 'Core');
const module3 = makeModule('03', 'Wrap');
const course = makeCourse([module1, module2, module3]);

function makeIndex(
  modules: Record<string, boolean>,
  cumulatives: QuizIndex['cumulativeQuizzes'],
): QuizIndex {
  return { modules, cumulativeQuizzes: cumulatives };
}

function makeAttempt(
  over: Partial<{
    overdue: boolean;
    ready: boolean;
    due: boolean;
    score: number;
    total: number;
    date: string;
  }> = {},
): QuizAttemptStatus {
  return {
    attempted: true,
    score: over.score ?? 0,
    total: over.total ?? 0,
    date: over.date ?? '2024-01-01T00:00:00Z',
    due: over.due ?? false,
    overdue: over.overdue ?? false,
    ready: over.ready ?? false,
  };
}

function makeStatus(overrides: Partial<CourseQuizStatus> = {}): CourseQuizStatus {
  return {
    courseID: 'c1',
    modules: [],
    cumulativeQuizzes: [],
    ...overrides,
  };
}

describe('quizDrive', () => {
  describe('presenceFromIndex', () => {
    test('strips dir prefix to moduleId', () => {
      const idx = makeIndex({ '01-intro': true, '02-core': false }, []);
      const presence = presenceFromIndex(idx);
      expect(presence.modules).toEqual([
        { moduleId: '01', hasQuiz: true },
        { moduleId: '02', hasQuiz: false },
      ]);
    });

    test('passes cumulative quizzes through', () => {
      const idx = makeIndex({}, [{ id: 'cq1', milestone: 2 }]);
      const presence = presenceFromIndex(idx);
      expect(presence.cumulativeQuizzes).toEqual([{ id: 'cq1', milestone: 2 }]);
    });
  });

  describe('nextQuizAfter', () => {
    test('returns next target in order', () => {
      const idx = makeIndex({ '01-intro': true, '02-core': true }, [{ id: 'cq1', milestone: 1 }]);
      const presence = presenceFromIndex(idx);
      const next = nextQuizAfter(course, presence, 'module:01');
      expect(next?.key).toBe('module:02');
    });

    test('returns null when at end', () => {
      const idx = makeIndex({ '01-intro': true }, []);
      const presence = presenceFromIndex(idx);
      expect(nextQuizAfter(course, presence, 'module:01')).toBeNull();
    });

    test('returns null when currentKey not found', () => {
      const idx = makeIndex({ '01-intro': true }, []);
      const presence = presenceFromIndex(idx);
      expect(nextQuizAfter(course, presence, 'module:99')).toBeNull();
    });

    test('skips modules without quiz', () => {
      const idx = makeIndex({ '01-intro': true, '02-core': false, '03-wrap': true }, []);
      const presence = presenceFromIndex(idx);
      const next = nextQuizAfter(course, presence, 'module:01');
      expect(next?.key).toBe('module:03');
    });
  });

  describe('targetAttempt', () => {
    test('returns module attempt', () => {
      const status = makeStatus({
        modules: [
          { moduleId: '01', moduleName: 'Intro', attempt: makeAttempt({ score: 80, total: 100 }) },
        ],
      });
      const target = { key: 'module:01', kind: 'module' as const, label: 'Intro', module: module1 };
      expect(targetAttempt(status, target)?.score).toBe(80);
    });

    test('returns cumulative attempt', () => {
      const status = makeStatus({
        cumulativeQuizzes: [
          { id: 'cq1', milestone: 1, displayLabel: 'C1', attempt: makeAttempt({ score: 50 }) },
        ],
      });
      const target = {
        key: 'cumulative:cq1',
        kind: 'cumulative' as const,
        label: 'cq1',
        cumulativeQuizId: 'cq1',
      };
      expect(targetAttempt(status, target)?.score).toBe(50);
    });

    test('returns null when no attempt', () => {
      expect(
        targetAttempt(makeStatus(), {
          key: 'module:01',
          kind: 'module' as const,
          label: 'l',
          module: module1,
        }),
      ).toBeNull();
    });
  });

  describe('dueTargets', () => {
    test('returns targets where attempt is due', () => {
      const status = makeStatus({
        modules: [
          { moduleId: '01', moduleName: 'Intro', attempt: makeAttempt({ due: true }) },
          { moduleId: '02', moduleName: 'Core', attempt: makeAttempt({ due: false }) },
        ],
        cumulativeQuizzes: [
          { id: 'cq1', milestone: 1, displayLabel: 'C1', attempt: makeAttempt({ due: true }) },
        ],
      });
      const targets = dueTargets(course, status);
      expect(targets.map((t) => t.key)).toEqual(['module:01', 'cumulative:cq1']);
    });
  });

  describe('dueStateOf', () => {
    const baseTarget = { key: 'module:01', kind: 'module' as const, label: 'l', module: module1 };

    test('overdue', () => {
      const status = makeStatus({
        modules: [{ moduleId: '01', moduleName: 'Intro', attempt: makeAttempt({ overdue: true }) }],
      });
      expect(dueStateOf(status, baseTarget)).toBe('overdue');
    });

    test('ready', () => {
      const status = makeStatus({
        modules: [{ moduleId: '01', moduleName: 'Intro', attempt: makeAttempt({ ready: true }) }],
      });
      expect(dueStateOf(status, baseTarget)).toBe('ready');
    });

    test('none when no attempt or no due flag', () => {
      expect(dueStateOf(makeStatus(), baseTarget)).toBe('none');
    });
  });

  describe('targetToView', () => {
    test('module target → quiz view', () => {
      const v = targetToView(course, {
        key: 'module:01',
        kind: 'module',
        label: 'l',
        module: module1,
      });
      expect(v.type).toBe('quiz');
    });

    test('cumulative target → cumulativeQuiz view', () => {
      const v = targetToView(course, {
        key: 'cumulative:cq1',
        kind: 'cumulative',
        label: 'cq1',
        cumulativeQuizId: 'cq1',
      });
      expect(v.type).toBe('cumulativeQuiz');
    });

    test('module target without module fallback → dashboard', () => {
      const v = targetToView(course, { key: 'module:01', kind: 'module', label: 'l' });
      expect(v.type).toBe('dashboard');
    });
  });
});
