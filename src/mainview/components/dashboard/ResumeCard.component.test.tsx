import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { LastSession } from '../../../bun/types';
import { useCompletionStore } from '../../stores/completionStore';
import { useViewStore } from '../../stores/viewStore';
import { clearMocks, mockResponse, setupRPC } from '../../testUtils';
import ResumeCard from './ResumeCard';

setupRPC();

function makeLastSession(overrides?: Partial<LastSession>): LastSession {
  return {
    course: {
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
    },
    module: { id: 'mod-01', name: 'Module 1', timeHours: 5, prerequisites: [], topics: [] },
    sectionId: 'sec-1',
    scrollPosition: 0,
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  clearMocks();
  mockResponse('quizIndex', { modules: {}, cumulativeQuizzes: [] });
  mockResponse('hasCumulativeQuiz', false);
  useCompletionStore.setState({
    completed: {},
    totalModules: {},
    loading: {},
    loaded: false,
    optimisticCompleted: {},
  });
  useViewStore.setState({ views: [] });
});

describe('ResumeCard', () => {
  const user = userEvent.setup();

  test('renders course name and module progress', () => {
    const { getByText } = render(<ResumeCard lastSession={makeLastSession()} />);
    expect(getByText('Test Course')).toBeInTheDocument();
    expect(getByText(/Module 1/)).toBeInTheDocument();
  });

  test('computes done count from completed store', () => {
    useCompletionStore.setState({
      completed: { 'c1:mod-01': true, 'c1:mod-02': true },
      totalModules: { c1: 3 },
    });
    const { container } = render(<ResumeCard lastSession={makeLastSession()} />);
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('/');
    expect(container.textContent).toContain('67');
  });

  test('handleContinue pushes lesson view with sectionID', async () => {
    useViewStore.setState({ views: [] });
    const { getByText } = render(<ResumeCard lastSession={makeLastSession()} />);
    await user.click(getByText('Continue'));
    const views = useViewStore.getState().views;
    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({
      type: 'lesson',
      course: expect.objectContaining({ id: 'c1' }),
      module: expect.objectContaining({ id: 'mod-01' }),
      sectionID: 'sec-1',
    });
  });

  test('shows next module name when not last module', () => {
    const { getByText } = render(<ResumeCard lastSession={makeLastSession()} />);
    expect(getByText(/Module 2/)).toBeInTheDocument();
  });

  test('shows courseComplete when last module', () => {
    const lastSession = makeLastSession({
      module: { id: 'mod-02', name: 'Module 2', timeHours: 5, prerequisites: [], topics: [] },
    });
    const { getByText } = render(<ResumeCard lastSession={lastSession} />);
    expect(getByText(/Course complete/i)).toBeInTheDocument();
  });
});
