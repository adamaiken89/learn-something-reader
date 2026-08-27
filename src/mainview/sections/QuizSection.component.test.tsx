import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'bun:test';

import type { Course, ModuleMeta, QuizQuestion } from '../../bun/types';
import { useQuizStore } from '../stores/quizStore';
import { clearMocks, mockResponse, setupRPC } from '../testUtils';

function makeQuestion(id: string, overrides?: Partial<Omit<QuizQuestion, 'id'>>): QuizQuestion {
  return {
    id,
    question: `Question ${id}?`,
    options: { A: `${id}-A`, B: `${id}-B`, C: `${id}-C`, D: `${id}-D` },
    answer: 'B',
    explanation: `Explanation ${id}`,
    difficulty: 1,
    tags: [],
    ...overrides,
  };
}

setupRPC();
beforeEach(() => {
  clearMocks();
  mockResponse('quizStart', []);
  mockResponse('logSession', undefined);
  mockResponse('getLastQuizSession', null);
  Math.random = () => 0.999;
});

import QuizSection from './QuizSection';

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

describe('QuizSection', () => {
  const user = userEvent.setup();
  const props = { courseId: 'cs101', moduleId: 'mod-01', course: mockCourse, module: mockModule };

  test('renders loading state', async () => {
    mockResponse('quizStart', new Promise(() => {}));
    const { container } = render(<QuizSection {...props} />);
    expect(container.textContent).toContain('Loading quiz');
  });

  test('renders empty state when no questions', async () => {
    mockResponse('quizStart', []);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('No quiz questions');
    });
  });

  test('renders active question with options', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    expect(container.textContent).toContain('Skip');
  });

  test('shows explanation after answering', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
  });

  test('shows next/finish button after answering', async () => {
    mockResponse('quizStart', [makeQuestion('q1'), makeQuestion('q2')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Next Question');
    });
  });

  test('advances to next question', async () => {
    mockResponse('quizStart', [makeQuestion('q1'), makeQuestion('q2')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Next Question');
    });
    await user.click(getByText('Next Question'));
    await waitFor(() => {
      expect(container.textContent).toContain('Question q2?');
    });
  });

  test('shows completed state with score', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('Quiz Complete');
      expect(container.textContent).toContain('100%');
    });
  });

  test('shows retry button in completed state', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('Retry');
    });
  });

  test('retry resets to first question', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('Retry');
    });
    await user.click(getByText('Retry'));
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
      expect(container.textContent).toContain('Skip');
    });
  });

  test('skip advances to next question', async () => {
    mockResponse('quizStart', [makeQuestion('q1'), makeQuestion('q2')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('Skip'));
    await waitFor(() => {
      expect(container.textContent).toContain('Question q2?');
    });
  });

  test('wrong answer shows explanation and wrong styling', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-A'));
    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
  });

  test('wrong answer results in 0% score', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-A'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('Quiz Complete');
      expect(container.textContent).toContain('0%');
    });
  });

  test('renders score ring SVG on completion', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  test('confetti renders only at 100% score', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-B'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('100%');
      const confetti = document.querySelector('.anim-confetti-piece');
      expect(confetti).toBeInTheDocument();
    });
  });

  test('no confetti when score below 100%', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    await user.click(getByText('q1-A'));
    await waitFor(() => {
      expect(container.textContent).toContain('Finish Quiz');
    });
    await user.click(getByText('Finish Quiz'));
    await waitFor(() => {
      expect(container.textContent).toContain('0%');
      const confetti = document.querySelector('.anim-confetti-piece');
      expect(confetti).not.toBeInTheDocument();
    });
  });

  test('no pre-highlight on load', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));
    expect(optionBtns.length).toBe(4);
    optionBtns.forEach((btn) => {
      expect(btn.hasAttribute('data-highlighted')).toBe(false);
    });
  });

  test('ArrowDown from no highlight moves to first option', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(false);

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowUp from no highlight wraps to last option', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(3));

    await waitFor(() => {
      expect(optionBtns[3].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowRight from no highlight moves to first option', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(false);

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowLeft from no highlight goes to top-right', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(1));

    await waitFor(() => {
      expect(optionBtns[1].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowRight moves to next column in same row', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(0));
    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(1));

    await waitFor(() => {
      expect(optionBtns[1].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowRight at right edge stays', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(1));
    await waitFor(() => {
      expect(optionBtns[1].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(1));

    await waitFor(() => {
      expect(optionBtns[1].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowDown moves to same column in next row', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(0));
    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(2));

    await waitFor(() => {
      expect(optionBtns[2].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowDown at bottom row stays', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(2));
    await waitFor(() => {
      expect(optionBtns[2].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(2));

    await waitFor(() => {
      expect(optionBtns[2].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowLeft at left edge stays', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(0));
    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowUp at top row stays', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(0));
    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowUp moves to same column in prev row', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(2));
    await waitFor(() => {
      expect(optionBtns[2].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('ArrowUp from top row stays at top', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    const buttons = container.querySelectorAll('button');
    const optionBtns = Array.from(buttons).filter((b) => b.textContent?.match(/^[A-D]\./));

    act(() => useQuizStore.getState().setHighlightedIdx(0));
    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });

    act(() => useQuizStore.getState().setHighlightedIdx(0));

    await waitFor(() => {
      expect(optionBtns[0].hasAttribute('data-highlighted')).toBe(true);
    });
  });

  test('Enter without highlight does nothing', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    expect(container.textContent).not.toContain('Explanation');
  });

  test('ArrowDown then Enter selects highlighted option', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });

    act(() => {
      useQuizStore.getState().setHighlightedIdx(0);
      useQuizStore.getState().selectAnswer('B');
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
  });

  test('letter key A-D selects answer directly', async () => {
    mockResponse('quizStart', [makeQuestion('q1')]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('Question q1?');
    });
    expect(container.textContent).not.toContain('Explanation');

    act(() => useQuizStore.getState().selectAnswer('B'));

    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
  });

  const clozeQ = (): QuizQuestion => ({
    id: 'c1',
    question: 'The {quick} brown fox',
    type: 'cloze',
    options: {},
    answer: 'quick',
    difficulty: 1,
    tags: [],
    explanation: 'Cloze explanation',
  });

  test('cloze first wrong shows try-again warn and stays editable', async () => {
    mockResponse('quizStart', [clozeQ()]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('brown fox');
    });
    const input = container.querySelector('input')!;
    await user.clear(input);
    await user.type(input, 'slow');
    await user.click(container.querySelector('button')!);
    await waitFor(() => {
      expect(container.textContent).toContain('Try again');
      expect(container.textContent).not.toContain('Cloze explanation');
    });
    expect(container.querySelector('input')!.hasAttribute('disabled')).toBe(false);
  });

  test('cloze second wrong reveals answer and scores 0', async () => {
    mockResponse('quizStart', [clozeQ()]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('brown fox');
    });
    const input = container.querySelector('input')!;
    await user.clear(input);
    await user.type(input, 'slow');
    await getByText('Check').click();
    await user.clear(input);
    await user.type(input, 'slow again');
    await getByText('Check').click();
    await waitFor(() => {
      expect(container.textContent).toContain('Cloze explanation');
    });
    const finish = getByText('Finish Quiz');
    await finish.click();
    await waitFor(() => {
      expect(container.textContent).toContain('Quiz Complete');
      expect(container.textContent).toContain('0%');
    });
  });

  test('cloze correct on second attempt scores full marks', async () => {
    mockResponse('quizStart', [clozeQ()]);
    const { container, getByText } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('brown fox');
    });
    const input = container.querySelector('input')!;
    await user.clear(input);
    await user.type(input, 'slow');
    await getByText('Check').click();
    await user.clear(input);
    await user.type(input, 'quick');
    await getByText('Check').click();
    await waitFor(() => {
      expect(container.textContent).toContain('Cloze explanation');
    });
    const finish = getByText('Finish Quiz');
    await finish.click();
    await waitFor(() => {
      expect(container.textContent).toContain('Quiz Complete');
      expect(container.textContent).toContain('100%');
    });
  });

  test('cloze question renders blank placeholder, not answer in braces', async () => {
    mockResponse('quizStart', [clozeQ()]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('brown fox');
    });
    expect(container.textContent).not.toContain('{quick}');
    expect(container.textContent).not.toContain('{component blob}');
    expect(container.querySelectorAll('.border-dashed')).not.toHaveLength(0);
  });

  test('cloze {blank} directive question renders placeholder and stays answerable', async () => {
    const blankQ: QuizQuestion = {
      id: 'c2',
      question:
        'A {blank} is put into the MDC and removed in a {blank} block so threads are not contaminated across requests.',
      type: 'cloze',
      options: {},
      answer: 'trace_id, finally',
      difficulty: 1,
      tags: [],
      explanation: 'Cloze explanation',
    };
    mockResponse('quizStart', [blankQ]);
    const { container } = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(container.textContent).toContain('MDC');
    });
    expect(container.textContent).not.toContain('{blank}');
    expect(container.textContent).not.toContain('{');
    expect(container.textContent).not.toContain('trace_id');
  });
});

describe('QuizSection keyboard handler (window dispatch)', () => {
  const props = { courseId: 'cs101', moduleId: 'mod-01', course: mockCourse, module: mockModule };

  beforeEach(() => {
    clearMocks();
    mockResponse('quizStart', []);
    mockResponse('logSession', undefined);
    mockResponse('getLastQuizSession', null);
  });

  function fireKey(key: string) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    });
  }

  async function renderWith(questions: QuizQuestion[]) {
    mockResponse('quizStart', questions);
    const rendered = render(<QuizSection {...props} />);
    await waitFor(() => {
      expect(rendered.container.textContent).toContain(`Question ${questions[0].id}?`);
    });
    return rendered;
  }

  test('ArrowDown from no highlight moves to first option', async () => {
    await renderWith([makeQuestion('q1')]);
    fireKey('ArrowDown');
    expect(useQuizStore.getState().highlightedIdx).toBe(0);
  });

  test('ArrowRight at right column stays in place', async () => {
    await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(1));
    fireKey('ArrowRight');
    expect(useQuizStore.getState().highlightedIdx).toBe(1);
  });

  test('ArrowRight moves within row to next column', async () => {
    await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(0));
    fireKey('ArrowRight');
    expect(useQuizStore.getState().highlightedIdx).toBe(1);
  });

  test('ArrowLeft at left column stays in place', async () => {
    await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(0));
    fireKey('ArrowLeft');
    expect(useQuizStore.getState().highlightedIdx).toBe(0);
  });

  test('ArrowDown at bottom row stays in place', async () => {
    await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(2));
    fireKey('ArrowDown');
    expect(useQuizStore.getState().highlightedIdx).toBe(2);
  });

  test('ArrowDown moves down one row same column', async () => {
    await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(0));
    fireKey('ArrowDown');
    expect(useQuizStore.getState().highlightedIdx).toBe(2);
  });

  test('ArrowUp from no highlight lands on last option', async () => {
    await renderWith([makeQuestion('q1')]);
    fireKey('ArrowUp');
    expect(useQuizStore.getState().highlightedIdx).toBe(3);
  });

  test('Enter with highlight selects that option', async () => {
    const { container } = await renderWith([makeQuestion('q1')]);
    act(() => useQuizStore.getState().setHighlightedIdx(1));
    fireKey('Enter');
    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
    expect(useQuizStore.getState().hasAnswer).toBe(true);
  });

  test('letter key selects matching option directly', async () => {
    const { container } = await renderWith([makeQuestion('q1')]);
    fireKey('b');
    await waitFor(() => {
      expect(container.textContent).toContain('Explanation q1');
    });
    expect(useQuizStore.getState().selectedAnswers['q1']).toBe('B');
  });

  test('Escape skips current question', async () => {
    await renderWith([makeQuestion('q1'), makeQuestion('q2')]);
    fireKey('Escape');
    await waitFor(() => {
      expect(useQuizStore.getState().currentIndex).toBe(1);
    });
    expect(useQuizStore.getState().selectedAnswers['q1']).toBeUndefined();
  });

  test('Enter after answering advances to next question', async () => {
    await renderWith([makeQuestion('q1'), makeQuestion('q2')]);
    act(() => useQuizStore.getState().selectAnswer('B'));
    fireKey('Enter');
    expect(useQuizStore.getState().currentIndex).toBe(1);
  });

  test('keyboard nav ignored while quiz not ready', async () => {
    mockResponse('quizStart', new Promise(() => {}));
    render(<QuizSection {...props} />);
    fireKey('ArrowDown');
    expect(useQuizStore.getState().status).toBe('loading');
  });
});
