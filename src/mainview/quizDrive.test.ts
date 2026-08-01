import { describe, expect, test } from 'bun:test';

import type { CourseQuizStatus, QuizAttemptStatus } from '../bun/stats';
import type { Course } from '../bun/types';
import { dueStateOf, dueTargets, type QuizTarget, targetAttempt } from './quizDrive';

const course: Course = {
  id: 'cs101',
  course: 'CS 101',
  displayName: 'Intro to CS',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'Computer Science',
  prerequisites: [],
  learningObjectives: [],
  modules: [{ id: '1', name: 'Getting Started', timeHours: 1, prerequisites: [], topics: [] }],
};

const attempt = (over: Partial<QuizAttemptStatus>): QuizAttemptStatus => ({
  attempted: true,
  score: 0,
  total: 0,
  date: '',
  due: false,
  overdue: false,
  ready: false,
  ...over,
});

const status = (over: Partial<CourseQuizStatus>): CourseQuizStatus => ({
  courseID: 'cs101',
  modules: [{ moduleId: '1', moduleName: 'Getting Started', attempt: null }],
  cumulativeQuizzes: [],
  ...over,
});

const moduleTarget: QuizTarget = {
  key: 'module:1',
  kind: 'module',
  label: 'Getting Started',
  module: course.modules[0],
};

describe('targetAttempt', () => {
  test('returns module attempt for module target', () => {
    const a = attempt({ score: 9, total: 10 });
    const st = status({
      modules: [{ moduleId: '1', moduleName: 'Getting Started', attempt: a }],
    });
    expect(targetAttempt(st, moduleTarget)).toEqual(a);
  });

  test('returns null when module missing', () => {
    const st = status({ modules: [] });
    expect(targetAttempt(st, moduleTarget)).toBeNull();
  });

  test('returns cumulative attempt for cumulative target', () => {
    const a = attempt({});
    const st = status({
      cumulativeQuizzes: [{ id: 'cq1', milestone: 1, displayLabel: '01–03', attempt: a }],
    });
    const cumTarget: QuizTarget = {
      key: 'cumulative:cq1',
      kind: 'cumulative',
      label: 'cq1',
      cumulativeQuizId: 'cq1',
    };
    expect(targetAttempt(st, cumTarget)).toEqual(a);
  });
});

describe('dueTargets', () => {
  test('filters only due targets', () => {
    const st = status({
      modules: [
        {
          moduleId: '1',
          moduleName: 'Getting Started',
          attempt: attempt({ due: true, ready: true }),
        },
      ],
    });
    const targets = dueTargets(course, st);
    expect(targets).toHaveLength(1);
    expect(targets.map((t) => t.kind)).toEqual(['module']);
  });

  test('excludes non-due targets', () => {
    const st = status({
      modules: [{ moduleId: '1', moduleName: 'Getting Started', attempt: attempt({}) }],
    });
    expect(dueTargets(course, st)).toHaveLength(0);
  });

  test('includes cumulative due and ignores unattempted cumulative', () => {
    const a = attempt({ due: true, ready: true });
    const st = status({
      cumulativeQuizzes: [
        { id: 'cq1', milestone: 1, displayLabel: '01–03', attempt: a },
        { id: 'cq2', milestone: 2, displayLabel: '04–06', attempt: null },
      ],
    });
    const targets = dueTargets(course, st);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.key).toBe('cumulative:cq1');
  });
});

describe('dueStateOf', () => {
  test('overdue wins over ready', () => {
    const st = status({
      modules: [
        {
          moduleId: '1',
          moduleName: 'Getting Started',
          attempt: attempt({ overdue: true, ready: true }),
        },
      ],
    });
    expect(dueStateOf(st, moduleTarget)).toBe('overdue');
  });

  test('ready when ready and not overdue', () => {
    const st = status({
      modules: [
        { moduleId: '1', moduleName: 'Getting Started', attempt: attempt({ ready: true }) },
      ],
    });
    expect(dueStateOf(st, moduleTarget)).toBe('ready');
  });

  test('none when not due', () => {
    const st = status({
      modules: [{ moduleId: '1', moduleName: 'Getting Started', attempt: attempt({}) }],
    });
    expect(dueStateOf(st, moduleTarget)).toBe('none');
  });

  test('none when no attempt', () => {
    const st = status({
      modules: [{ moduleId: '1', moduleName: 'Getting Started', attempt: null }],
    });
    expect(dueStateOf(st, moduleTarget)).toBe('none');
  });
});
