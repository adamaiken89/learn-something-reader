import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course } from '../../bun/types';
import i18n from '../i18n';
import { useSettingsStore } from '../stores/settingsStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import CumulativeQuizPage from './CumulativeQuizPage';

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
  modules: [],
};

describe('CumulativeQuizPage', () => {
  const defaultProps = {
    course: mockCourse,
    onBack: () => {},
  };

  beforeEach(() => {
    clearMocks();
    void i18n.changeLanguage('en-US');
    useSettingsStore.setState({ focusMode: false });
    mockResponse('loadCumulativeQuiz', { questions: [] });
    mockResponse('coursesList', []);
  });

  test('snapshot — loading', async () => {
    mockResponse('loadCumulativeQuiz', new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizPage {...defaultProps} />).container;
    });
    expect(container!.textContent).toContain('CS 101');
    expect(container!.textContent).toContain('Cumulative Review');
  });

  test('snapshot — loaded with questions', async () => {
    mockResponse('loadCumulativeQuiz', {
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'What is 2 + 2?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correctAnswer: 'B',
          explanation: 'Basic arithmetic.',
        },
      ],
    });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('CS 101');
    });
    expect(container!.textContent).toContain('Cumulative Review');
  });

  test('shows course name and Cumulative Review in header', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizPage {...defaultProps} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('CS 101');
    });
    expect(container!.textContent).toContain('Cumulative Review');
  });

  test('shows range label for cumulativeQuizId', async () => {
    let container: HTMLElement;
    await act(async () => {
      container = render(
        <CumulativeQuizPage {...defaultProps} cumulativeQuizId="cumulative_quiz_01-03.yaml" />,
      ).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('01–03');
    });
  });

  test('calls onBack when back button clicked', async () => {
    let called = false;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      getByText = render(
        <CumulativeQuizPage
          {...defaultProps}
          onBack={() => {
            called = true;
          }}
        />,
      ).getByText;
    });
    await waitFor(() => {
      expect(getByText!('← Back')).toBeInTheDocument();
    });
    getByText!('← Back').click();
    expect(called).toBe(true);
  });
});
