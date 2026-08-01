import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../../bun/types';
import { useViewStore } from '../../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import QuizReviewButtons from './QuizReviewButtons';

setupRPC();

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
  clearMocks();
  mockResponse('hasCumulativeQuiz', false);
});

describe('QuizReviewButtons', () => {
  const user = userEvent.setup();

  test('quiz popover opens and MCQ pushes quiz view', async () => {
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: mod }],
    });
    const { getByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Quiz'));
    await user.click(getByText('MCQ'));
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

  test('quiz popover shows cumulative when available', async () => {
    mockResponse('hasCumulativeQuiz', true);
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: mod }],
    });
    const { getByText, queryByText } = render(<QuizReviewButtons />);
    await user.click(getByText('Quiz'));
    await waitFor(() => expect(getByText('Cumulative')).toBeTruthy());
    expect(queryByText('Cloze')).toBeNull();
  });
});
