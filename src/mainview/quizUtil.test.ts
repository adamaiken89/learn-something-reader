import { describe, expect, test } from 'bun:test';

import type { QuizQuestion } from '../bun/types';
import {
  blankCorrect,
  clozeAnswers,
  clozeCorrect,
  clozeScore,
  normalizeClozeBlanks,
  parseClozeText,
  questionPoints,
  totalPointsFor,
} from './quizUtil';

function clozeQ(question: string, answer: string): QuizQuestion {
  return {
    id: 'c.1',
    type: 'cloze',
    question,
    options: {},
    answer,
    explanation: '',
    difficulty: 1,
    tags: [],
  };
}

describe('parseClozeText', () => {
  test('splits text and blanks, collects answers', () => {
    const { segments, answers } = parseClozeText('The {indexer} stores {events}');
    expect(segments).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'blank', value: 'indexer' },
      { type: 'text', value: ' stores ' },
      { type: 'blank', value: 'events' },
    ]);
    expect(answers).toEqual(['indexer', 'events']);
  });

  test('literal {blank} directive yields blank segment without answer', () => {
    const { segments, answers } = parseClozeText('A {blank} block');
    expect(segments).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'blank', value: '' },
      { type: 'text', value: ' block' },
    ]);
    expect(answers).toEqual([]);
  });
});

describe('clozeAnswers', () => {
  test('prefers {term} markers over the answer field', () => {
    const q = clozeQ('The {indexer} stores data', 'wrong-drifted-answer');
    expect(clozeAnswers(q)).toEqual(['indexer']);
  });

  test('falls back to the answer field for {blank} directives', () => {
    const q = clozeQ('A {blank}...{blank} block', 'trace_id, finally');
    expect(clozeAnswers(q)).toEqual(['trace_id, finally']);
  });
});

describe('blankCorrect', () => {
  test('case/whitespace/trailing-punctuation insensitive', () => {
    expect(blankCorrect('Indexer', ' indexer ')).toBe(true);
    expect(blankCorrect('HTTPS.', 'https')).toBe(true);
    expect(blankCorrect('universal  forwarder', 'Universal Forwarder')).toBe(true);
  });

  test('edit distance ≤ 1 accepted for words ≥ 4 chars, rejected for short words', () => {
    expect(blankCorrect('indexer', 'idnexer')).toBe(true);
    expect(blankCorrect('props.conf', 'props.cong')).toBe(true);
    expect(blankCorrect('indexer', 'idxer')).toBe(false);
    expect(blankCorrect('bus', 'bas')).toBe(false);
  });

  test('empty user answer never matches', () => {
    expect(blankCorrect('indexer', '')).toBe(false);
    expect(blankCorrect('indexer', '   ')).toBe(false);
  });

  test('different word rejected', () => {
    expect(blankCorrect('indexer', 'forwarder')).toBe(false);
  });
});

describe('clozeScore', () => {
  test('per-blank partial credit', () => {
    const q = clozeQ('The {indexer} parses and the {forwarder} ships', 'indexer, forwarder');
    expect(clozeScore(q, 'indexer, forwarder')).toEqual({
      correctBlanks: 2,
      totalBlanks: 2,
      results: [true, true],
    });
    expect(clozeScore(q, 'idnexer, forwarder')).toEqual({
      correctBlanks: 2,
      totalBlanks: 2,
      results: [true, true],
    });
    expect(clozeScore(q, 'forwarder, indexer')).toEqual({
      correctBlanks: 0,
      totalBlanks: 2,
      results: [false, false],
    });
  });

  test('missing blanks score wrong', () => {
    const q = clozeQ('The {indexer} and the {forwarder}', 'indexer, forwarder');
    expect(clozeScore(q, 'indexer').results).toEqual([true, false]);
    expect(clozeScore(q, undefined).correctBlanks).toBe(0);
  });

  test('single whole-string compare for {blank}-directive fallback', () => {
    const q = clozeQ('A {blank}...{blank} block.', 'trace_id, finally');
    expect(clozeScore(q, 'trace_id, finally').correctBlanks).toBe(1);
    expect(clozeScore(q, 'finally, trace_id').correctBlanks).toBe(0);
  });

  test('answer-field fallback when no markers', () => {
    const q = clozeQ('Plain question', 'the answer');
    expect(clozeScore(q, 'The answer.').correctBlanks).toBe(1);
  });
});

describe('clozeCorrect', () => {
  test('true only when every blank matches', () => {
    const q = clozeQ('The {indexer} and {forwarder}', 'indexer, forwarder');
    expect(clozeCorrect(q, 'INDEXER, forwarder')).toBe(true);
    expect(clozeCorrect(q, 'indexer, wrong')).toBe(false);
    expect(clozeCorrect(q, undefined)).toBe(false);
  });
});

describe('normalizeClozeBlanks', () => {
  test('rewrites answer to comma-joined terms for cloze only', () => {
    const cloze = clozeQ('The {indexer} and {forwarder}', 'drifted');
    const mcq: QuizQuestion = { ...cloze, type: 'multiple-choice', question: 'plain' };
    const [outCloze, outMcq] = normalizeClozeBlanks([cloze, mcq]);
    expect(outCloze.answer).toBe('indexer, forwarder');
    expect(outMcq.answer).toBe('drifted');
  });
});

describe('points', () => {
  test('questionPoints: cloze partial credit, mcq all-or-nothing', () => {
    const q = clozeQ('The {indexer} and {forwarder}', 'indexer, forwarder');
    expect(questionPoints(q, 'indexer, nope')).toBe(1);
    expect(questionPoints(q, undefined)).toBe(0);
    const mcq: QuizQuestion = { ...q, type: 'multiple-choice', question: 'plain' };
    expect(questionPoints(mcq, 'indexer, forwarder')).toBe(1);
    expect(questionPoints(mcq, 'A')).toBe(0);
  });

  test('totalPointsFor: one per blank, one per mcq/tf', () => {
    const cloze = clozeQ('The {indexer} and {forwarder}', 'indexer, forwarder');
    const mcq: QuizQuestion = { ...cloze, type: 'multiple-choice', question: 'plain' };
    const tf: QuizQuestion = { ...cloze, type: 'tf', question: 'plain' };
    expect(totalPointsFor([cloze, mcq, tf])).toBe(4);
  });
});
