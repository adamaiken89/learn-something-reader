import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../../bun/types';
import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import ProgressBadge from './ProgressBadge';

function makeCourse(id: string, moduleCount: number): Course {
  return {
    id,
    course: 'Test',
    timeBudgetHours: 10,
    targetLevel: 'beginner',
    domain: 'test',
    prerequisites: [],
    learningObjectives: [],
    modules: Array.from({ length: moduleCount }, (_, i) => ({
      id: `mod-${i}`,
      name: `Module ${i}`,
      timeHours: 1,
      prerequisites: [],
      topics: [],
    })),
    displayName: 'Test Course',
  };
}

beforeEach(() => {
  useViewStore.setState({ views: [] });
  useCompletionStore.setState({ completed: {}, totalModules: {}, optimisticCompleted: {} });
});

describe('ProgressBadge', () => {
  test('returns null when no course in view', () => {
    const { container } = render(<ProgressBadge />);
    expect(container.innerHTML).toBe('');
  });

  test('returns null when course has zero modules', () => {
    useViewStore.setState({
      views: [
        {
          type: 'lesson',
          course: makeCourse('c1', 0),
          module: { id: 'm1', name: 'M', timeHours: 1, prerequisites: [], topics: [] },
        },
      ],
    });
    const { container } = render(<ProgressBadge />);
    expect(container.innerHTML).toBe('');
  });

  test('shows 0/N when nothing completed', () => {
    const course = makeCourse('c1', 3);
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: course.modules[0] }],
    });
    const { getByText } = render(<ProgressBadge />);
    expect(getByText('0/3')).toBeInTheDocument();
  });

  test('shows completed count', () => {
    const course = makeCourse('c1', 3);
    useViewStore.setState({
      views: [{ type: 'lesson', course, module: course.modules[0] }],
    });
    useCompletionStore.setState({
      completed: { 'c1:mod-0': true, 'c1:mod-1': true },
    });
    const { getByText } = render(<ProgressBadge />);
    expect(getByText('2/3')).toBeInTheDocument();
  });
});
