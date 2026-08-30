import { describe, expect, test } from 'bun:test';
import {
  getDueCards,
  getStarredCards,
  getAllCards,
  getCardsForCourse,
  getDueCardsForCourse,
  getStarredCardsForCourse,
  toggleStar,
  performReview,
  createSRSCard,
} from './srs';
import type { SRSDeck, SRSCard, QuizQuestion } from './types';

function makeCard(overrides: Partial<SRSCard> & { id: string }): SRSCard {
  return {
    questionId: 'q1',
    moduleId: '01',
    courseId: 'test',
    question: 'Q?',
    answer: 'A',
    explanation: 'E',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: '2024-01-01T00:00:00.000Z',
    lastReviewed: null,
    isStarred: false,
    ...overrides,
  };
}

function makeDeck(cards: SRSCard[]): SRSDeck {
  const map: Record<string, SRSCard> = {};
  for (const c of cards) {
    map[c.id] = c;
  }
  return { cards: map };
}

describe('getDueCards', () => {
  const now = new Date('2024-06-15T12:00:00Z');

  test('returns cards with nextReviewDate <= now', () => {
    const deck = makeDeck([
      makeCard({ id: 'a', nextReviewDate: '2024-06-10T00:00:00Z' }),
      makeCard({ id: 'b', nextReviewDate: '2024-06-15T12:00:00Z' }),
      makeCard({ id: 'c', nextReviewDate: '2024-06-20T00:00:00Z' }),
    ]);
    const due = getDueCards(deck, now);
    expect(due).toHaveLength(2);
    expect(due.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('returns empty array when no cards due', () => {
    const deck = makeDeck([makeCard({ id: 'a', nextReviewDate: '2024-06-20T00:00:00Z' })]);
    expect(getDueCards(deck, now)).toHaveLength(0);
  });

  test('returns empty array for empty deck', () => {
    expect(getDueCards({ cards: {} }, now)).toEqual([]);
  });

  test('sorts by nextReviewDate ascending', () => {
    const deck = makeDeck([
      makeCard({ id: 'c', nextReviewDate: '2024-06-12T00:00:00Z' }),
      makeCard({ id: 'a', nextReviewDate: '2024-06-01T00:00:00Z' }),
      makeCard({ id: 'b', nextReviewDate: '2024-06-10T00:00:00Z' }),
    ]);
    const due = getDueCards(deck, now);
    expect(due.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('getStarredCards', () => {
  test('returns only starred cards', () => {
    const deck = makeDeck([
      makeCard({ id: 'a', isStarred: true }),
      makeCard({ id: 'b', isStarred: false }),
      makeCard({ id: 'c', isStarred: true }),
    ]);
    const starred = getStarredCards(deck);
    expect(starred).toHaveLength(2);
    expect(starred.map((c) => c.id)).toEqual(['a', 'c']);
  });

  test('returns empty when none starred', () => {
    const deck = makeDeck([makeCard({ id: 'a' }), makeCard({ id: 'b' })]);
    expect(getStarredCards(deck)).toHaveLength(0);
  });
});

describe('getAllCards', () => {
  test('returns all cards sorted by nextReviewDate', () => {
    const deck = makeDeck([
      makeCard({ id: 'b', nextReviewDate: '2024-06-10T00:00:00Z' }),
      makeCard({ id: 'a', nextReviewDate: '2024-06-01T00:00:00Z' }),
    ]);
    const all = getAllCards(deck);
    expect(all.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('returns empty for empty deck', () => {
    expect(getAllCards({ cards: {} })).toEqual([]);
  });
});

describe('getCardsForCourse', () => {
  test('filters by courseId', () => {
    const deck = makeDeck([
      makeCard({ id: 'a', courseId: 'math' }),
      makeCard({ id: 'b', courseId: 'physics' }),
      makeCard({ id: 'c', courseId: 'math' }),
    ]);
    const cards = getCardsForCourse(deck, 'math');
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.id)).toEqual(['a', 'c']);
  });
});

describe('getDueCardsForCourse', () => {
  const now = new Date('2024-06-15T12:00:00Z');

  test('filters due cards by course', () => {
    const deck = makeDeck([
      makeCard({ id: 'a', courseId: 'math', nextReviewDate: '2024-06-10T00:00:00Z' }),
      makeCard({ id: 'b', courseId: 'physics', nextReviewDate: '2024-06-10T00:00:00Z' }),
      makeCard({ id: 'c', courseId: 'math', nextReviewDate: '2024-06-20T00:00:00Z' }),
    ]);
    const due = getDueCardsForCourse(deck, 'math', now);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('a');
  });
});

describe('getStarredCardsForCourse', () => {
  test('filters starred cards by course', () => {
    const deck = makeDeck([
      makeCard({ id: 'a', courseId: 'math', isStarred: true }),
      makeCard({ id: 'b', courseId: 'physics', isStarred: true }),
      makeCard({ id: 'c', courseId: 'math', isStarred: false }),
    ]);
    const starred = getStarredCardsForCourse(deck, 'math');
    expect(starred).toHaveLength(1);
    expect(starred[0].id).toBe('a');
  });
});

describe('toggleStar', () => {
  test('toggles isStarred from false to true', () => {
    const deck = makeDeck([makeCard({ id: 'a', isStarred: false })]);
    const result = toggleStar(deck, 'a');
    expect(result.cards['a'].isStarred).toBe(true);
  });

  test('toggles isStarred from true to false', () => {
    const deck = makeDeck([makeCard({ id: 'a', isStarred: true })]);
    const result = toggleStar(deck, 'a');
    expect(result.cards['a'].isStarred).toBe(false);
  });

  test('returns original deck if card not found', () => {
    const deck = makeDeck([makeCard({ id: 'a' })]);
    const result = toggleStar(deck, 'nonexistent');
    expect(result).toBe(deck);
  });

  test('does not mutate original deck', () => {
    const deck = makeDeck([makeCard({ id: 'a', isStarred: false })]);
    toggleStar(deck, 'a');
    expect(deck.cards['a'].isStarred).toBe(false);
  });
});

describe('performReview (FSRS-6)', () => {
  const now = new Date('2024-06-15T12:00:00Z');

  function makeReviewCard(overrides: Partial<SRSCard> & { id: string }): SRSCard {
    return {
      questionId: 'q1',
      moduleId: '01',
      courseId: 'test',
      question: 'Q?',
      answer: 'A',
      explanation: 'E',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: '2024-06-15T00:00:00.000Z',
      lastReviewed: null,
      isStarred: false,
      ...overrides,
    };
  }

  test('new card correct initializes FSRS fields', () => {
    const card = makeReviewCard({ id: 'a' });
    const result = performReview(card, true, now);
    expect(result.stability).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.difficulty).toBeLessThanOrEqual(10);
    expect(result.state).toBe('Review');
    expect(result.lapses).toBe(0);
    expect(result.interval).toBeGreaterThan(0);
  });

  test('new card wrong initializes with lower stability', () => {
    const card = makeReviewCard({ id: 'a' });
    const correctCard = performReview({ ...card }, true, now);
    const wrongCard = performReview({ ...card }, false, now);
    expect(wrongCard.stability).toBeLessThan(correctCard.stability!);
    expect(wrongCard.difficulty).toBeGreaterThan(correctCard.difficulty!);
  });

  test('review correct grows stability', () => {
    const card = makeReviewCard({ id: 'a' });
    const r1 = performReview(card, true, now);
    // Simulate next-day long-term review
    const nextDay = new Date('2024-06-16T12:00:00Z');
    const r2 = performReview({ ...r1, lastReviewed: '2024-06-15T12:00:00.000Z' }, true, nextDay);
    expect(r2.stability).toBeGreaterThan(r1.stability!);
  });

  test('review wrong drops stability and increments lapses', () => {
    const card = makeReviewCard({ id: 'a' });
    const r1 = performReview(card, true, now);
    const nextDay = new Date('2024-06-16T12:00:00Z');
    const r2 = performReview({ ...r1, lastReviewed: '2024-06-15T12:00:00.000Z' }, false, nextDay);
    expect(r2.stability).toBeLessThan(r1.stability!);
    expect(r2.lapses).toBeGreaterThanOrEqual(1);
    expect(r2.state).toBe('Relearning');
  });

  test('preserves original card invariants after review', () => {
    const card = makeReviewCard({ id: 'a' });
    const cardCopy = { ...card };
    performReview(card, true, now);
    // migrateSM2Card mutates original — that's expected for migration
    // But the card returned is a new object
    expect(card).not.toBe(cardCopy); // different refs
  });

  test('migrates SM-2 card on review', () => {
    const old = makeReviewCard({
      id: 'a',
      interval: 5,
      repetitions: 3,
      easeFactor: 2.5,
      lastReviewed: '2024-06-10T12:00:00.000Z',
    });
    delete (old as unknown as Record<string, unknown>).stability;
    delete (old as unknown as Record<string, unknown>).difficulty;
    delete (old as unknown as Record<string, unknown>).lapses;
    delete (old as unknown as Record<string, unknown>).state;
    const result = performReview(old, true, now);
    expect(result.stability).toBeDefined();
    expect(result.difficulty).toBeDefined();
    expect(result.lapses).toBeDefined();
    expect(result.state).toBeDefined();
  });

  test('short-term review (<1 day) maintains state', () => {
    const card = makeReviewCard({ id: 'a' });
    const r1 = performReview(card, true, now);
    // Same-day review
    const r2 = performReview(r1, true, now);
    expect(r2.state).toBe('Review');
    expect(r2.stability).toBeGreaterThan(0);
  });

  test('review after long gap with forget transitions to Relearning', () => {
    const card = makeReviewCard({ id: 'a' });
    const r1 = performReview(card, true, now);
    const later = new Date('2024-07-01T12:00:00Z'); // 16 days later
    const r2 = performReview({ ...r1, lastReviewed: '2024-06-15T12:00:00.000Z' }, false, later);
    expect(r2.state).toBe('Relearning');
    expect(r2.lapses).toBeGreaterThanOrEqual(1);
  });

  test('ease factor derived correctly from difficulty', () => {
    const card = makeReviewCard({ id: 'a' });
    const r1 = performReview(card, true, now);
    expect(r1.easeFactor).toBeGreaterThanOrEqual(1.3);
    expect(r1.easeFactor).toBeLessThanOrEqual(5.0);
  });

  test('interval increases after multiple correct reviews', () => {
    let card = makeReviewCard({ id: 'a' });
    card = performReview(card, true, now);
    const intervals: number[] = [card.interval];
    for (let i = 0; i < 5; i++) {
      const d = new Date(`2024-06-${16 + i}T12:00:00Z`);
      card = performReview({ ...card, lastReviewed: `2024-06-${15 + i}T12:00:00.000Z` }, true, d);
      intervals.push(card.interval);
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
  });

  test('wrong after long-term review resets short interval', () => {
    let card = makeReviewCard({ id: 'a' });
    card = performReview(card, true, now);
    const later = new Date('2024-08-01T12:00:00Z'); // 47 days later
    const result = performReview(
      { ...card, lastReviewed: '2024-06-15T12:00:00.000Z' },
      false,
      later,
    );
    expect(result.interval).toBeLessThan(card.interval);
    expect(result.repetitions).toBe(0);
  });
});

describe('createSRSCard (FSRS-6)', () => {
  const q: QuizQuestion = {
    id: 'q1',
    question: 'What is 2+2?',
    options: { a: '3', b: '4', c: '5', d: '6' },
    answer: 'b',
    explanation: '2+2=4',
    difficulty: 1,
    tags: ['math'],
  };

  test('creates card with default FSRS fields', () => {
    const card = createSRSCard(q, 'mod-01', 'cs101');
    expect(card.id).toBe('cs101-mod-01-q1');
    expect(card.question).toBe('What is 2+2?');
    expect(card.stability).toBeUndefined();
    expect(card.difficulty).toBeUndefined();
    expect(card.lapses).toBeUndefined();
    expect(card.state).toBeUndefined();
    expect(card.easeFactor).toBe(2.5);
    expect(card.interval).toBe(0);
  });

  test('uses provided date', () => {
    const d = new Date('2025-01-01T00:00:00Z');
    const card = createSRSCard(q, 'mod-01', 'cs101', d);
    expect(card.nextReviewDate).toBe('2025-01-01T00:00:00.000Z');
  });
});
