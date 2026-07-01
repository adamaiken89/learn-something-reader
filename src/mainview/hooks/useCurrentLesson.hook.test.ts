import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../bun/types';
import { useViewStore } from '../stores/viewStore';
import { useCurrentLesson } from './useCurrentLesson';

const course: Course = {
  id: 'c1',
  course: 'Test',
  timeBudgetHours: 10,
  targetLevel: 'beginner',
  domain: 'test',
  prerequisites: [],
  learningObjectives: [],
  modules: [{ id: 'mod-1', name: 'Mod', timeHours: 1, prerequisites: [], topics: [] }],
  displayName: 'Test',
};

const mod = course.modules[0];

beforeEach(() => {
  useViewStore.setState({ views: [] });
});

describe('useCurrentLesson', () => {
  test('returns nulls when no lesson view', () => {
    useViewStore.setState({ views: [{ type: 'courseList' }] });
    const { result } = renderHook(() => useCurrentLesson());
    expect(result.current).toEqual({ course: null, module: null });
  });

  test('returns nulls on empty views', () => {
    const { result } = renderHook(() => useCurrentLesson());
    expect(result.current).toEqual({ course: null, module: null });
  });

  test('returns course and module from lesson view', () => {
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: mod }],
    });
    const { result } = renderHook(() => useCurrentLesson());
    expect(result.current.course).toBe(course);
    expect(result.current.module).toBe(mod);
  });

  test('returns last view when multiple views exist', () => {
    useViewStore.setState({
      views: [{ type: 'courseList' }, { type: 'lesson', course, module: mod }],
    });
    const { result } = renderHook(() => useCurrentLesson());
    expect(result.current.course).toBe(course);
  });

  test('returns nulls when top view is not lesson', () => {
    useViewStore.setState({
      views: [
        { type: 'lesson', course, module: mod },
        { type: 'quiz', course, module: mod },
      ],
    });
    const { result } = renderHook(() => useCurrentLesson());
    expect(result.current).toEqual({ course: null, module: null });
  });
});
