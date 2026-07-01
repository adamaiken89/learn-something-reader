import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../bun/types';
import i18n from '../i18n';
import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';
import CourseListPage from './CourseListPage';

const mockCourse: Course = {
  id: 'cs101',
  course: 'CS 101',
  displayName: 'Intro to CS',
  timeBudgetHours: 40,
  targetLevel: 'beginner',
  domain: 'Computer Science',
  prerequisites: [],
  learningObjectives: ['Learn basics', 'Write programs'],
  modules: [
    { id: 'mod-01', name: 'Module 1', timeHours: 10, prerequisites: [], topics: ['intro'] },
    { id: 'mod-02', name: 'Module 2', timeHours: 10, prerequisites: [], topics: ['loops'] },
  ],
};

describe('CourseListPage', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en-US');
    useCourseStore.setState({
      courses: [],
      loading: false,
      error: null,
      loaded: true,
    });
    useCompletionStore.setState({
      completed: {},
      totalModules: {},
      loading: {},
      loaded: true,
    });
  });

  test('shows empty message when no courses', () => {
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('No courses');
  });

  test('shows courses when loaded', () => {
    useCourseStore.setState({ courses: [mockCourse], loaded: true });
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('Intro to CS');
  });

  test('pushes moduleList view when course clicked', () => {
    useCourseStore.setState({ courses: [mockCourse], loaded: true });
    useViewStore.setState({ views: [] });
    const { container } = render(<CourseListPage />);
    const courseBtn = container.querySelector('button.text-left') as HTMLButtonElement;
    act(() => courseBtn.click());
    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    const v = views[0];
    expect(v).toMatchObject({ type: 'moduleList', course: { id: 'cs101' } });
  });
  test('shows loading state', () => {
    useCourseStore.setState({ loading: true });
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('Loading courses');
  });

  test('shows error state', () => {
    useCourseStore.setState({ error: 'Network error' });
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('Network error');
  });

  test('displays progress for completed modules', () => {
    useCourseStore.setState({ courses: [mockCourse], loaded: true });
    useCompletionStore.setState({
      completed: { 'cs101:mod-01': true },
    });
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('1/2');
  });

  test('displays learning objectives', () => {
    useCourseStore.setState({ courses: [mockCourse], loaded: true });
    const { container } = render(<CourseListPage />);
    expect(container.textContent).toContain('Learn basics');
    expect(container.textContent).toContain('Write programs');
  });
});
