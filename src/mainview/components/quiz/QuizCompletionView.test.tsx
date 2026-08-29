import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, mock, test } from 'bun:test';

import type { QuizQuestion, StudySession } from '../../../bun/types';
import QuizCompletionView from './QuizCompletionView';

const mkQ = (id: string): QuizQuestion =>
  ({
    id,
    question: `Q ${id}`,
    type: 'mcq',
    options: { A: 'A', B: 'B' },
    answer: 'A',
    explanation: `Explanation for ${id}`,
  }) as unknown as QuizQuestion;

describe('QuizCompletionView', () => {
  test('renders score ring with percentage', () => {
    const { container } = render(
      <QuizCompletionView
        score={7}
        total={10}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
      />,
    );
    expect(container.textContent).toContain('70%');
  });

  test('renders 100% confetti', () => {
    const { container } = render(
      <QuizCompletionView
        score={5}
        total={5}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
      />,
    );
    expect(container.querySelector('.anim-confetti-piece')).toBeTruthy();
  });

  test('renders previous session passed badge', () => {
    const prev: StudySession = { score: 9, total: 10 } as StudySession;
    const { container } = render(
      <QuizCompletionView
        score={8}
        total={10}
        previousSession={prev}
        questionResults={[]}
        onRetry={() => {}}
      />,
    );
    expect(container.textContent).toContain('Previous attempt: Passed');
  });

  test('renders previous session failed badge', () => {
    const prev: StudySession = { score: 5, total: 10 } as StudySession;
    const { container } = render(
      <QuizCompletionView
        score={8}
        total={10}
        previousSession={prev}
        questionResults={[]}
        onRetry={() => {}}
      />,
    );
    expect(container.textContent).toContain('Previous attempt: Failed');
  });

  test('filter buttons switch view', async () => {
    const user = userEvent.setup();
    const q1 = mkQ('q1');
    const q2 = mkQ('q2');
    const { container, getByText } = render(
      <QuizCompletionView
        score={1}
        total={2}
        previousSession={null}
        questionResults={[
          { question: q1, isCorrect: true, userAnswer: 'A' },
          { question: q2, isCorrect: false, userAnswer: 'B' },
        ]}
        onRetry={() => {}}
      />,
    );
    expect(container.textContent).toContain('Q q1');
    expect(container.textContent).toContain('Q q2');
    await user.click(getByText(/Correct \(1\)/));
    expect(container.textContent).toContain('Q q1');
    expect(container.textContent).not.toContain('Q q2');
  });

  test('renders question results with explanation', () => {
    const q = mkQ('q1');
    const { container, getByText } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[{ question: q, isCorrect: true, userAnswer: 'A' }]}
        onRetry={() => {}}
      />,
    );
    expect(getByText('Q q1')).toBeInTheDocument();
    expect(container.textContent).toContain('Explanation for q1');
  });

  test('renders retry button', async () => {
    const onRetry = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[]}
        onRetry={onRetry}
      />,
    );
    await user.click(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  test('renders back to lesson button when provided', async () => {
    const onBack = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
        onBackToLesson={onBack}
      />,
    );
    await user.click(getByText('Back to Lesson'));
    expect(onBack).toHaveBeenCalled();
  });

  test('renders back to dashboard when no back to lesson', () => {
    const onBack = mock(() => {});
    const { getByText } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
        onBackToDashboard={onBack}
      />,
    );
    expect(getByText('Back to Dashboard')).toBeInTheDocument();
  });

  test('renders next quiz button when onNextQuiz provided', async () => {
    const onNext = mock(() => {});
    const user = userEvent.setup();
    const { getByText } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
        onNextQuiz={onNext}
      />,
    );
    await user.click(getByText(/Next Quiz/));
    expect(onNext).toHaveBeenCalled();
  });

  test('renders next chapter button when onNextChapter provided', () => {
    const onNext = mock(() => {});
    const { container } = render(
      <QuizCompletionView
        score={1}
        total={1}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
        onNextChapter={onNext}
      />,
    );
    expect(container.textContent).toContain('Next Chapter');
  });

  test('handles total=0 with 0% percentage', () => {
    const { container } = render(
      <QuizCompletionView
        score={0}
        total={0}
        previousSession={null}
        questionResults={[]}
        onRetry={() => {}}
      />,
    );
    expect(container.textContent).toContain('0%');
  });
});
