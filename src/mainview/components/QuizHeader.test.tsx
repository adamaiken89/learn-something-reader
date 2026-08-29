import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';
import QuizHeader from './QuizHeader';

const mockCourse = {
  id: 'math',
  course: 'math',
  displayName: 'Mathematics',
  modules: [{ id: '01', name: 'Algebra', timeHours: 2, topics: [], prerequisites: [] }],
  timeBudgetHours: 5,
  targetLevel: 'beginner',
  domain: 'math',
  prerequisites: [],
  learningObjectives: [],
};

beforeEach(() => {
  useViewStore.setState({ views: [] });
  useCourseStore.setState({ courses: [mockCourse], loaded: true, loading: false });
});

describe('QuizHeader', () => {
  test('renders back button and title', () => {
    const { getByText } = render(
      <QuizHeader onBack={() => {}} currentCourseId="math" title="Module 01" />,
    );
    expect(getByText('Module 01')).toBeInTheDocument();
  });

  test('hides all-quizzes button when onAllQuizzes not provided', () => {
    const { queryByText } = render(
      <QuizHeader onBack={() => {}} currentCourseId="math" title="T" />,
    );
    expect(queryByText('All Quizzes')).toBeNull();
  });

  test('shows and triggers all-quizzes button when onAllQuizzes provided', async () => {
    const onAllQuizzes = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(
      <QuizHeader onBack={() => {}} currentCourseId="math" title="T" onAllQuizzes={onAllQuizzes} />,
    );
    await user.click(getByText('All Quizzes'));
    expect(onAllQuizzes).toHaveBeenCalled();
  });

  test('triggers onBack callback when back clicked', async () => {
    const onBack = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(<QuizHeader onBack={onBack} currentCourseId="math" title="T" />);
    await user.click(getByText('← Back'));
    expect(onBack).toHaveBeenCalled();
  });

  test('CourseSwitcher selection triggers view replace', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<QuizHeader onBack={() => {}} currentCourseId="math" title="T" />);
    await user.click(getByText('Mathematics'));
    await user.click(getByText('0/1 (0%)'));
    expect(useViewStore.getState().views[0]?.type).toBe('lesson');
  });
});
