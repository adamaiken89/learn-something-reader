import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../../bun/types';
import { useCourseStore } from '../../stores/courseStore';
import { useViewStore } from '../../stores/viewStore';
import CardsButton from './CardsButton';

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

beforeEach(() => {
  useViewStore.setState({ views: [{ type: 'lesson', course, module: course.modules[0] }] });
  useCourseStore.setState({ courses: [course] });
});

describe('CardsButton', () => {
  const user = userEvent.setup();

  test('pushes userCardReview on click', async () => {
    const { getByText } = render(<CardsButton />);
    await user.click(getByText(/Cards/));
    const views = useViewStore.getState().views;
    expect(views[views.length - 1].type).toBe('userCardReview');
  });

  test('does nothing without course', async () => {
    useViewStore.setState({ views: [{ type: 'dashboard' }] });
    const { getByText } = render(<CardsButton />);
    await user.click(getByText(/Cards/));
    expect(useViewStore.getState().views).toHaveLength(1);
  });

  test('does nothing if course not found in store', async () => {
    useCourseStore.setState({ courses: [] });
    const { getByText } = render(<CardsButton />);
    await user.click(getByText(/Cards/));
    expect(useViewStore.getState().views).toHaveLength(1);
  });
});
