import { beforeEach, describe, expect, test } from 'bun:test';

import type { QuizQuestion } from '../../bun/types';
import { useQuizStore } from './quizStore';

function clozeQ(id: string, question: string, answer: string): QuizQuestion {
  return {
    id,
    type: 'cloze',
    question,
    options: {},
    answer,
    explanation: '',
    difficulty: 1,
    tags: [],
  };
}

function mcqQ(id: string, answer: string): QuizQuestion {
  return {
    id,
    type: 'multiple-choice',
    question: 'plain',
    options: { A: answer, B: 'other' },
    answer,
    explanation: '',
    difficulty: 1,
    tags: [],
  };
}

const MULTI = clozeQ('c.1', 'The {indexer} and {forwarder}', 'indexer, forwarder');

describe('quizStore partial credit', () => {
  beforeEach(() => {
    useQuizStore.getState().reset();
  });

  test('totalPoints counts blanks + one per non-cloze', () => {
    useQuizStore.getState().setQuestions([MULTI, mcqQ('m.1', 'A')]);
    expect(useQuizStore.getState().totalPoints).toBe(3);
  });

  test('fully correct first attempt scores full and locks', () => {
    useQuizStore.getState().setQuestions([MULTI]);
    useQuizStore.getState().selectAnswer('indexer, forwarder');
    const s = useQuizStore.getState();
    expect(s.hasAnswer).toBe(true);
    expect(s.score).toBe(2);
    expect(s.selectedAnswers['c.1']).toBe('indexer, forwarder');
  });

  test('wrong first attempt keeps editable and unscored, second resolves with partial credit', () => {
    useQuizStore.getState().setQuestions([MULTI]);
    useQuizStore.getState().selectAnswer('indexer, nope');
    let s = useQuizStore.getState();
    expect(s.hasAnswer).toBe(false);
    expect(s.score).toBe(0);
    expect(s.clozeAttempts['c.1']).toBe(1);

    useQuizStore.getState().selectAnswer('idnexer, forwarder');
    s = useQuizStore.getState();
    expect(s.hasAnswer).toBe(true);
    expect(s.score).toBe(2); // 'idnexer' accepted as a one-typo answer
    expect(s.clozeAttempts['c.1']).toBe(2);
  });

  test('setClozeBlankInput pads and stores per-blank values; submitCloze joins them', () => {
    useQuizStore.getState().setQuestions([MULTI]);
    useQuizStore.getState().setClozeBlankInput(1, 'forwarder');
    expect(useQuizStore.getState().clozeBlankInputs).toEqual(['', 'forwarder']);

    // Incomplete: submit refused
    useQuizStore.getState().submitCloze();
    expect(useQuizStore.getState().hasAnswer).toBe(false);

    useQuizStore.getState().setClozeBlankInput(0, ' indexer ');
    useQuizStore.getState().submitCloze();
    const s = useQuizStore.getState();
    expect(s.hasAnswer).toBe(true);
    expect(s.selectedAnswers['c.1']).toBe('indexer, forwarder');
    expect(s.score).toBe(2);
  });

  test('nextQuestion clears blank inputs', () => {
    const q2 = clozeQ('c.2', 'The {shard}', 'shard');
    useQuizStore.getState().setQuestions([MULTI, q2]);
    useQuizStore.getState().setClozeBlankInput(0, 'indexer');
    useQuizStore.getState().nextQuestion();
    expect(useQuizStore.getState().clozeBlankInputs).toEqual([]);
  });

  test('mixed quiz: mcq point plus partial cloze point accumulate', () => {
    useQuizStore.getState().setQuestions([MULTI, mcqQ('m.1', 'A')]);
    useQuizStore.getState().selectAnswer('indexer, nope'); // wrong attempt 1
    useQuizStore.getState().selectAnswer('indexer, forwarder'); // resolves: 2 pts
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().selectAnswer('A'); // 1 pt
    expect(useQuizStore.getState().score).toBe(3);
  });
});
