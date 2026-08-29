import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import CourseCard from './CourseCard';

const baseCourse = {
  id: 'math',
  course: 'math',
  displayName: 'Mathematics',
  modules: [
    { id: '01', name: 'Algebra', timeHours: 2, topics: [], prerequisites: [] },
    { id: '02', name: 'Geometry', timeHours: 3, topics: [], prerequisites: [] },
  ],
  timeBudgetHours: 5,
  targetLevel: 'beginner',
  domain: 'math',
  prerequisites: [],
  learningObjectives: [],
};

beforeEach(() => {
  useViewStore.setState({ views: [] });
  useCompletionStore.setState({ completed: {}, totalModules: {} });
});

describe('CourseCard', () => {
  test('renders course name and level badge', () => {
    const { getByText } = render(<CourseCard course={baseCourse} />);
    expect(getByText('Mathematics')).toBeInTheDocument();
    expect(getByText('Beginner')).toBeInTheDocument();
  });

  test('formats multi-word target level', () => {
    const { getByText } = render(
      <CourseCard course={{ ...baseCourse, targetLevel: 'advanced-graduate' }} />,
    );
    expect(getByText('Advanced Graduate')).toBeInTheDocument();
  });

  test('click pushes syllabus view', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<CourseCard course={baseCourse} />);
    await user.click(getByTestId('course-card'));
    const views = useViewStore.getState().views;
    expect(views.length).toBe(1);
    expect(views[0].type).toBe('syllabus');
  });

  test('Enter key pushes syllabus view', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<CourseCard course={baseCourse} />);
    getByTestId('course-card').focus();
    await user.keyboard('{Enter}');
    expect(useViewStore.getState().views.length).toBe(1);
  });

  test('Space key pushes syllabus view', async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(<CourseCard course={baseCourse} />);
    getByTestId('course-card').focus();
    await user.keyboard(' ');
    expect(useViewStore.getState().views.length).toBe(1);
  });

  test('Start label when no modules completed', () => {
    const { getByText } = render(<CourseCard course={baseCourse} />);
    expect(getByText('Start')).toBeInTheDocument();
  });

  test('Continue label when some modules completed', () => {
    useCompletionStore.setState({
      completed: { 'math:01': true },
      totalModules: { math: 2 },
    });
    const { getByText } = render(<CourseCard course={baseCourse} />);
    expect(getByText('Continue')).toBeInTheDocument();
  });

  test('Complete label when all modules done', () => {
    useCompletionStore.setState({
      completed: { 'math:01': true, 'math:02': true },
      totalModules: { math: 2 },
    });
    const { getByText } = render(<CourseCard course={baseCourse} />);
    expect(getByText('Complete')).toBeInTheDocument();
  });

  test('handles total=0 with no crash', () => {
    useCompletionStore.setState({ totalModules: { math: 0 } });
    const { getByText } = render(<CourseCard course={baseCourse} />);
    expect(getByText('Start')).toBeInTheDocument();
  });
});
