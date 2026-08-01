import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../bun/types';
import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import { useQuizDueStatus } from './useQuizDueStatus';

setupRPC();

beforeEach(() => {
  clearMocks();
  useCourseStore.setState({ courses: [], loading: false, error: null, loaded: true });
  useViewStore.setState({ views: [] });
});

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

const mcqStatus = (over: { due?: boolean; overdue?: boolean; ready?: boolean } = {}) => ({
  courseID: 'cs101',
  modules: [
    {
      moduleId: '1',
      moduleName: 'Getting Started',
      attempt: {
        attempted: true,
        score: 9,
        total: 10,
        date: '2026-08-01',
        due: over.due ?? false,
        overdue: over.overdue ?? false,
        ready: over.ready ?? false,
      },
    },
  ],
  cumulativeQuizzes: [],
});

describe('useQuizDueStatus', () => {
  test('splits due quizzes into ready and overdue buckets', async () => {
    useCourseStore.setState({ courses: [course] });
    mockResponse('quizStatus', mcqStatus({ due: true, overdue: true }));
    const { result } = renderHook(() => useQuizDueStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.overdue).toHaveLength(1);
    expect(result.current.ready).toHaveLength(0);
    expect(result.current.due).toHaveLength(1);
    expect(result.current.overdue[0]?.course.id).toBe('cs101');
    expect(result.current.overdue[0]?.view).toEqual({
      type: 'quiz',
      course,
      module: course.modules[0],
    });
  });

  test('ready bucket populated when ready and not overdue', async () => {
    useCourseStore.setState({ courses: [course] });
    mockResponse('quizStatus', mcqStatus({ due: true, ready: true }));
    const { result } = renderHook(() => useQuizDueStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toHaveLength(1);
    expect(result.current.overdue).toHaveLength(0);
  });

  test('empty when nothing due', async () => {
    useCourseStore.setState({ courses: [course] });
    mockResponse('quizStatus', mcqStatus());
    const { result } = renderHook(() => useQuizDueStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ready).toHaveLength(0);
    expect(result.current.overdue).toHaveLength(0);
    expect(result.current.due).toHaveLength(0);
  });

  test('empty when no courses', async () => {
    const { result } = renderHook(() => useQuizDueStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.due).toHaveLength(0);
  });

  test('refetches when views pop back to dashboard', async () => {
    useCourseStore.setState({ courses: [course] });
    mockResponse('quizStatus', mcqStatus());
    const { result } = renderHook(() => useQuizDueStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockResponse('quizStatus', mcqStatus({ due: true, ready: true }));
    await act(async () => {
      useViewStore.setState({ views: [{ type: 'quiz', course, module: course.modules[0] }] });
      await Promise.resolve();
    });
    await act(async () => {
      useViewStore.setState({ views: [] });
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.ready).toHaveLength(1));
  });
});
