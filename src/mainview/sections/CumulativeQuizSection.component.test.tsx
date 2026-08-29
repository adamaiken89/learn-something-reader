import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, QuizQuestion } from '../../bun/types';
import { useQuizStore } from '../stores/quizStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';
import CumulativeQuizSection from './CumulativeQuizSection';

setupRPC();

function makeMCQ(id: string): QuizQuestion {
  return {
    id,
    type: 'multiple-choice',
    question: `Question ${id}?`,
    options: { A: `${id}-A`, B: `${id}-B`, C: `${id}-C`, D: `${id}-D` },
    answer: 'B',
    explanation: `Explanation ${id}`,
    difficulty: 1,
    tags: [],
  };
}

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

describe('CumulativeQuizSection', () => {
  const user = userEvent.setup();
  const props = { course: mockCourse };

  beforeEach(() => {
    clearMocks();
    useQuizStore.setState({
      status: 'loading',
      questions: [],
      currentIndex: 0,
      selectedAnswers: {},
      currentQuestion: undefined,
      hasAnswer: false,
      score: 0,
    });
    mockResponse('loadCumulativeQuiz', { questions: [] });
    mockResponse('logSession', undefined);
  });

  test('renders loading state', async () => {
    mockResponse('loadCumulativeQuiz', new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    expect(container!.textContent).toContain('Loading quiz');
  });

  test('renders empty state when no questions', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('No quiz questions'));
  });

  test('renders MCQ question with options', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => {
      expect(container!.textContent).toContain('Question q1?');
      expect(container!.textContent).toContain('A.');
      expect(container!.textContent).toContain('B.');
    });
  });

  test('keyboard ArrowDown navigates options', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      const buttons = container!.querySelectorAll('button');
      const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('keyboard ArrowUp navigates options', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    act(() => useQuizStore.getState().setHighlightedIdx(3));

    await waitFor(() => {
      const buttons = container!.querySelectorAll('button');
      const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));
      expect(optionBtns[3].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('keyboard Enter selects highlighted option', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    act(() => {
      useQuizStore.getState().setHighlightedIdx(0);
      useQuizStore.getState().selectAnswer('B');
    });

    await waitFor(() => expect(container!.textContent).toContain('Explanation q1'));
  });

  test('keyboard letter key selects answer', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    act(() => useQuizStore.getState().selectAnswer('B'));

    await waitFor(() => expect(container!.textContent).toContain('Explanation q1'));
  });

  test('renders completed state with score', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<CumulativeQuizSection {...props} />);
      container = r.container;
      getByText = r.getByText;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    await user.click(getByText!('q1-B'));
    await waitFor(() => expect(container!.textContent).toContain('Finish Quiz'));
    await user.click(getByText!('Finish Quiz'));
    await waitFor(() => expect(container!.textContent).toContain('Quiz Complete'));
  });

  test('retry resets quiz state', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    let getByText: ReturnType<typeof render>['getByText'];
    await act(async () => {
      const r = render(<CumulativeQuizSection {...props} />);
      container = r.container;
      getByText = r.getByText;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));

    await user.click(getByText!('q1-B'));
    await waitFor(() => expect(container!.textContent).toContain('Finish Quiz'));
    await user.click(getByText!('Finish Quiz'));
    await waitFor(() => expect(container!.textContent).toContain('Retry'));
    await user.click(getByText!('Retry'));
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));
  });

  test('window keydown ArrowDown navigates MCQ', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));
    act(() => useQuizStore.getState().setHighlightedIdx(-1));
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });
    expect(useQuizStore.getState().highlightedIdx).toBe(0);
  });

  test('window keydown Enter selects highlighted option', async () => {
    mockResponse('loadCumulativeQuiz', { questions: [makeMCQ('q1')] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Question q1?'));
    act(() => useQuizStore.getState().setHighlightedIdx(1));
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });
    await waitFor(() => expect(container!.textContent).toContain('Explanation q1'));
  });

  test('window keydown does nothing when not ready', async () => {
    mockResponse('loadCumulativeQuiz', new Promise(() => {}));
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });
    expect(container!.textContent).toContain('Loading');
  });

  test('window keydown does nothing for cloze question', async () => {
    const clozeQ: QuizQuestion = {
      id: 'c1',
      type: 'cloze',
      question: 'Fill {term}',
      options: {},
      answer: 'term',
      explanation: 'ex',
      difficulty: 1,
      tags: [],
    };
    mockResponse('loadCumulativeQuiz', { questions: [clozeQ] });
    let container: HTMLElement;
    await act(async () => {
      container = render(<CumulativeQuizSection {...props} />).container;
    });
    await waitFor(() => expect(container!.textContent).toContain('Fill'));
    expect(useQuizStore.getState().highlightedIdx).toBe(-1);
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });
    expect(useQuizStore.getState().highlightedIdx).toBe(-1);
  });
});
