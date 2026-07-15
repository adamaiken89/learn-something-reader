import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta, QuizQuestion } from '../../bun/types';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import ClozeQuizSection from './ClozeQuizSection';

setupRPC();

function makeClozeQuestion(id: string, question: string, answer: string): QuizQuestion {
  return {
    id,
    question,
    options: {},
    answer,
    explanation: `Explanation ${id}`,
    difficulty: 1,
    tags: [],
  };
}

const mockModule: ModuleMeta = {
  id: 'mod-01',
  name: 'Module 1',
  timeHours: 10,
  prerequisites: [],
  topics: [],
};
const mockCourse: Course = {
  id: 'cs101',
  course: 'cs101',
  displayName: 'CS 101',
  timeBudgetHours: 100,
  targetLevel: 'beginner',
  domain: 'computer science',
  prerequisites: [],
  learningObjectives: [],
  modules: [mockModule],
};

describe('ClozeQuizSection', () => {
  const user = userEvent.setup();
  const props = { course: mockCourse, module: mockModule };

  beforeEach(() => {
    clearMocks();
    mockResponse('loadClozeQuiz', []);
    mockResponse('getLastQuizSession', null);
  });

  test('renders loading state', () => {
    mockResponse('loadClozeQuiz', new Promise(() => {}));
    mockResponse('getLastQuizSession', new Promise(() => {}));
    const { container } = render(<ClozeQuizSection {...props} />);
    expect(container.textContent).toContain('Loading quiz');
  });

  test('renders empty state when no questions', async () => {
    mockResponse('loadClozeQuiz', []);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('No quiz questions'));
  });

  test('renders question with {blank} markers as drop targets', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'The capital of France is {blank}.', 'Paris'),
    ]);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('The capital of France is');
      expect(container!.textContent).toContain('1 / 1');
    });
  });

  test('renders question with {term} markers as named blanks', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'The {capital} of France is Paris.', 'capital'),
    ]);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('The');
      expect(container!.textContent).toContain('of France is Paris');
    });
  });

  test('renders progress segments', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'Q1 {blank}', 'a'),
      makeClozeQuestion('q2', 'Q2 {blank}', 'b'),
    ]);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('1 / 2'));
  });

  test('skip button advances to next question', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'Q1 {blank}', 'a'),
      makeClozeQuestion('q2', 'Q2 {blank}', 'b'),
    ]);
    let container: HTMLElement;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<ClozeQuizSection {...props} />);
      container = r.container;
      getByText = r.getByText;
    });
    await waitFor(() => expect(container!.textContent).toContain('1 / 2'));
    await user.click(getByText!('Skip'));
    await waitFor(() => expect(container!.textContent).toContain('2 / 2'));
  });

  test('Escape key skips to next question', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'Q1 {blank}', 'a'),
      makeClozeQuestion('q2', 'Q2 {blank}', 'b'),
    ]);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('1 / 2'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(container!.textContent).toContain('2 / 2'));
  });

  test('renders completed state after finishing all questions', async () => {
    mockResponse('loadClozeQuiz', [makeClozeQuestion('q1', 'Q1 {blank}', 'a')]);
    let container: HTMLElement;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<ClozeQuizSection {...props} />);
      container = r.container;
      getByText = r.getByText;
    });
    await waitFor(() => expect(container!.textContent).toContain('1 / 1'));
    await user.click(getByText!('Skip'));
    await waitFor(() => expect(container!.textContent).toContain('Quiz Complete'));
  });

  test('retry resets to first question', async () => {
    mockResponse('loadClozeQuiz', [makeClozeQuestion('q1', 'Q1 {blank}', 'a')]);
    let container: HTMLElement;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<ClozeQuizSection {...props} />);
      container = r.container;
      getByText = r.getByText;
    });
    await waitFor(() => expect(container!.textContent).toContain('1 / 1'));
    await user.click(getByText!('Skip'));
    await waitFor(() => expect(container!.textContent).toContain('Quiz Complete'));
    await user.click(getByText!('Retry'));
    await waitFor(() => {
      expect(container!.textContent).toContain('1 / 1');
      expect(container!.textContent).toContain('Skip');
    });
  });

  test('renders token pool for blanks', async () => {
    mockResponse('loadClozeQuiz', [
      makeClozeQuestion('q1', 'The {blank} is blue.', 'sky'),
      makeClozeQuestion('q2', 'The sun is {blank}.', 'yellow'),
    ]);
    let container: HTMLElement;
    await act(async () => {
      container = render(<ClozeQuizSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('The');
      const tokens = container!.querySelectorAll('[class*="cursor-grab"]');
      expect(tokens.length).toBeGreaterThan(0);
    });
  });
});
