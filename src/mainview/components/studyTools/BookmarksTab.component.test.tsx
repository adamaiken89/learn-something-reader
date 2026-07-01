import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta } from '../../../bun/types';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';

setupRPC();

import { useCourseStore } from '../../stores/courseStore';
import { useLessonUIStore } from '../../stores/lessonUIStore';
import { useLessonViewStore } from '../../stores/lessonViewStore';
import { useViewStore } from '../../stores/viewStore';
import BookmarksTab from './BookmarksTab';

function makeCourse(overrides?: Partial<Course>): Course {
  return {
    id: 'c1',
    course: 'Test Course',
    displayName: 'Course',
    timeBudgetHours: 10,
    targetLevel: 'beginner',
    domain: 'test',
    prerequisites: [],
    learningObjectives: [],
    modules: [],
    ...overrides,
  };
}

function makeModule(overrides?: Partial<ModuleMeta>): ModuleMeta {
  return {
    id: 'm1',
    name: 'Mod',
    timeHours: 1,
    prerequisites: [],
    topics: [],
    ...overrides,
  };
}

describe('BookmarksTab', () => {
  beforeEach(() => {
    useViewStore.setState({ views: [] });
    useCourseStore.setState({ courses: [] });
    useLessonUIStore.setState({ visibleSection: null });
    useLessonViewStore.setState({ sections: [] });
    clearMocks();
  });

  test('shows loading state then content', async () => {
    mockResponse('getModuleBookmarks', new Promise(() => {}));
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('Loading bookmarks...')).toBeInTheDocument();
    });
  });

  test('shows no bookmarks message when empty', async () => {
    mockResponse('getModuleBookmarks', []);
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('No bookmarks yet.')).toBeInTheDocument();
    });
  });

  test('shows bookmark list when loaded', async () => {
    mockResponse('getModuleBookmarks', [
      { id: 'b1', title: 'My Bookmark', sectionID: null, courseID: 'c1', moduleID: 'm1' },
    ]);
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    useCourseStore.setState({
      courses: [makeCourse()],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('My Bookmark')).toBeInTheDocument();
    });
  });

  test('add bookmark button renders', async () => {
    mockResponse('getModuleBookmarks', []);
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('Add Bookmark')).toBeInTheDocument();
    });
  });

  test('delete button exists for each bookmark', async () => {
    mockResponse('getModuleBookmarks', [
      { id: 'b1', title: 'BM1', sectionID: 's1', courseID: 'c1', moduleID: 'm1' },
    ]);
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('Delete')).toBeInTheDocument();
    });
  });

  test('shows section bookmark type label', async () => {
    mockResponse('getModuleBookmarks', [
      { id: 'b1', title: 'Sec BM', sectionID: 's1', courseID: 'c1', moduleID: 'm1' },
    ]);
    useViewStore.setState({
      views: [{ type: 'lesson', course: makeCourse(), module: makeModule() }],
    });
    const { getByText } = render(<BookmarksTab />);
    await waitFor(() => {
      expect(getByText('Section')).toBeInTheDocument();
    });
  });
});
