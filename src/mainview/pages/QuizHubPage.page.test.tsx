import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { CourseQuizStatus } from '../../bun/stats';
import type { Course } from '../../bun/types';
import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import QuizHubPage from './QuizHubPage';

setupRPC();

const mockCourse: Course = {
  id: 'cs101',
  course: 'cs101',
  displayName: 'CS 101',
  timeBudgetHours: 100,
  targetLevel: 'beginner',
  domain: 'computer science',
  prerequisites: [],
  learningObjectives: [],
  modules: [
    { id: '1', name: 'Getting Started', timeHours: 1, prerequisites: [], topics: [] },
    { id: '2', name: 'Variables', timeHours: 1, prerequisites: [], topics: [] },
    { id: '3', name: 'Control Flow', timeHours: 1, prerequisites: [], topics: [] },
  ],
};

const mockQuizIndex = {
  modules: {
    '01-getting-started': true,
    '02-variables': true,
    '03-control-flow': true,
  },
  cumulativeQuizzes: [{ id: 'cumulative_quiz.yaml', milestone: 10 }],
};

const mockQuizStatus: CourseQuizStatus = {
  courseID: 'cs101',
  modules: [
    {
      moduleId: '1',
      moduleName: 'Getting Started',
      attempt: {
        attempted: true,
        score: 9,
        total: 10,
        date: '2026-08-01',
        due: true,
        overdue: true,
        ready: false,
      },
    },
    {
      moduleId: '2',
      moduleName: 'Variables',
      attempt: {
        attempted: true,
        score: 7,
        total: 10,
        date: '2026-08-10',
        due: false,
        overdue: false,
        ready: false,
      },
    },
    {
      moduleId: '3',
      moduleName: 'Control Flow',
      attempt: null,
    },
  ],
  cumulativeQuizzes: [
    {
      id: 'cumulative_quiz.yaml',
      milestone: 10,
      displayLabel: '',
      attempt: {
        attempted: true,
        score: 8,
        total: 10,
        date: '2026-07-01',
        due: true,
        overdue: true,
        ready: false,
      },
    },
  ],
};

describe('QuizHubPage', () => {
  const defaultProps = {
    course: mockCourse,
    onBack: () => {},
  };

  beforeEach(() => {
    clearMocks();
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
    mockResponse('quizStatus', mockQuizStatus);
    mockResponse('quizIndex', mockQuizIndex);
    mockResponse('coursesList', []);
  });

  test('snapshot — loading state', async () => {
    mockResponse('quizStatus', new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizHubPage {...defaultProps} />).container;
    });
    expect(container!.textContent).toContain('Quiz Hub');
  });

  test('renders course name and subtitle once loaded', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizHubPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('CS 101');
      expect(container!.textContent).toContain('Revise by working through quizzes in order');
    });
  });

  test('renders module quiz rows with attempt badges', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizHubPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Module Quizzes');
    });
    expect(container!.textContent).toContain('MCQ');
    expect(container!.textContent).toContain('Cloze');
    // Module 1 MCQ passed (90%) but due
    expect(container!.textContent).toContain('90%');
    expect(container!.textContent).toContain('Due');
  });

  test('renders cumulative review with Start Review', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizHubPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Start Review');
    });
    expect(container!.textContent).toContain('Cumulative Reviews');
  });

  test('renders empty state when no quizzes exist', async () => {
    mockResponse('quizStatus', { courseID: 'cs101', modules: [], cumulativeQuizzes: [] });
    mockResponse('quizIndex', { modules: {}, cumulativeQuizzes: [] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<QuizHubPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Module Quizzes');
    });
  });
});
