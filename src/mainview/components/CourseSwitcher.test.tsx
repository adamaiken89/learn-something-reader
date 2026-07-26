import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import CourseSwitcher from './CourseSwitcher';

const mockCourse = {
  id: 'math',
  course: 'math',
  displayName: 'Mathematics',
  modules: [
    { id: '01', name: 'Algebra', timeHours: 2, topics: ['equations'], prerequisites: [] },
    { id: '02', name: 'Geometry', timeHours: 3, topics: ['shapes'], prerequisites: [] },
  ],
  timeBudgetHours: 5,
  targetLevel: 'beginner',
  domain: 'math',
  prerequisites: [],
  learningObjectives: [],
};

beforeEach(() => {
  useCourseStore.setState({ courses: [mockCourse], loaded: true, loading: false });
  useCompletionStore.setState({ completed: {} });
});

describe('CourseSwitcher', () => {
  const user = userEvent.setup();

  test('renders trigger with current course name', () => {
    const { getByText } = render(<CourseSwitcher currentCourseId="math" onSelect={() => {}} />);
    expect(getByText('Mathematics')).toBeInTheDocument();
  });

  test('opens dropdown on click and shows metadata', async () => {
    const { getByText, container } = render(
      <CourseSwitcher currentCourseId="math" onSelect={() => {}} />,
    );
    await user.click(getByText('Mathematics'));
    const meta = container.querySelector('.text-indigo-400\\/90');
    expect(meta).toBeTruthy();
    const parts = meta!.textContent!.split('(');
    expect(parts.length).toBe(2);
  });

  test('selects course from dropdown', async () => {
    const onSelect = mock(() => {});
    const { getByText } = render(<CourseSwitcher currentCourseId="math" onSelect={onSelect} />);
    await user.click(getByText('Mathematics'));
    await user.click(getByText('0/2 (0%)'));
    expect(onSelect).toHaveBeenCalledWith(mockCourse);
  });

  test('closes dropdown on outside click', async () => {
    const { getByText, container } = render(
      <CourseSwitcher currentCourseId="math" onSelect={() => {}} />,
    );
    await user.click(getByText('Mathematics'));
    expect(container.querySelector('.anim-dropdown-in')).toBeTruthy();
    await user.click(document.body);
    expect(container.querySelector('.anim-dropdown-in')).toBeNull();
  });

  test('empty state shows no courses message', async () => {
    useCourseStore.setState({ courses: [] });
    const { getByText } = render(<CourseSwitcher currentCourseId="" onSelect={() => {}} />);
    await user.click(getByText('Modules'));
    expect(getByText('No courses found')).toBeInTheDocument();
  });
});
