import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../../bun/types';
import { useViewStore } from '../../stores/viewStore';
import QuizReviewButtons from './QuizReviewButtons';

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

describe('QuizReviewButtons', () => {
  const user = userEvent.setup();

  test('quiz button pushes quiz view', async () => {
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: mod }],
    });
    const { getByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Quiz'));
    const views = useViewStore.getState().views;
    expect(views[views.length - 1].type).toBe('quiz');
  });

  test('review button pushes review view', async () => {
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: mod }],
    });
    const { getByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Review'));
    const views = useViewStore.getState().views;
    expect(views[views.length - 1].type).toBe('review');
  });

  test('quiz button does nothing without course/module', async () => {
    useViewStore.setState({ views: [{ type: 'dashboard' }] });
    const { getByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Quiz'));
    expect(useViewStore.getState().views).toHaveLength(1);
  });

  test('review button does nothing without course', async () => {
    useViewStore.setState({ views: [{ type: 'dashboard' }] });
    const { getByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Review'));
    expect(useViewStore.getState().views).toHaveLength(1);
  });
});
