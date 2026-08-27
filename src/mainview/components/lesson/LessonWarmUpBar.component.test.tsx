import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../../bun/types';
import { useCourseStore } from '../../stores/courseStore';
import { useViewStore } from '../../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import LessonWarmUpBar from './LessonWarmUpBar';

setupRPC();

const COURSE: Course = {
  id: 'c1',
  course: 'test-course',
  displayName: 'Test Course',
  targetLevel: 'beginner',
  domain: 'testing',
  timeBudgetHours: 10,
  prerequisites: [],
  learningObjectives: [],
  modules: [
    { id: 'mod-01', name: 'Module 1', timeHours: 5, prerequisites: [], topics: [] },
    { id: 'mod-02', name: 'Module 2', timeHours: 5, prerequisites: [], topics: [] },
  ],
};

const today = new Date().toISOString().split('T')[0];

beforeEach(() => {
  clearMocks();
  localStorage.clear();
  useViewStore.setState({ views: [] });
  useCourseStore.setState({ courses: [COURSE] });
});

describe('LessonWarmUpBar', () => {
  const user = userEvent.setup();

  test('hidden while dueCount loading (null)', () => {
    mockResponse('getDueCardsCount', 5);
    const { container } = render(<LessonWarmUpBar courseId="c1" />);
    expect(container.firstChild).toBeNull();
  });

  test('hidden when zero cards due', async () => {
    mockResponse('getDueCardsCount', 0);
    const { container } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  test('hidden when already dismissed today', async () => {
    localStorage.setItem('coursereader-warmup-c1', today);
    let calls = 0;
    mockResponse('getDueCardsCount', () => {
      calls += 1;
      return 5;
    });
    const { container } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(calls).toBe(0));
    expect(container.firstChild).toBeNull();
  });

  test('shows warm-up count and buttons when cards due', async () => {
    mockResponse('getDueCardsCount', 4);
    const { getByText } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(getByText(/4 cards due/)).toBeInTheDocument());
    expect(getByText('Review Now')).toBeInTheDocument();
    expect(getByText('Dismiss')).toBeInTheDocument();
  });

  test('review button pushes review view for the course', async () => {
    mockResponse('getDueCardsCount', 2);
    const { getByText } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(getByText('Review Now')).toBeInTheDocument());

    await user.click(getByText('Review Now'));
    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({ type: 'review', course: expect.objectContaining({ id: 'c1' }) });
  });

  test('dismiss persists to localStorage and hides bar', async () => {
    mockResponse('getDueCardsCount', 2);
    const { container, getByText } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(container.textContent).toContain('2'));

    await user.click(getByText('Dismiss'));

    expect(localStorage.getItem('coursereader-warmup-c1')).toBe(today);
    expect(container.firstChild).toBeNull();
  });

  test('dueCount fetch failure falls back to hidden (count 0)', async () => {
    mockResponse('getDueCardsCount', () => Promise.reject(new Error('rpc down')));
    const { container } = render(<LessonWarmUpBar courseId="c1" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
