import { describe, expect, test } from 'bun:test';
import { parseCourse, parseCumulativeQuiz, parseQuiz, parseSections } from './courseLoader';
import { createSRSCard, performReview } from './srs';
import type { QuizQuestion, SRSCard } from './types';

describe('parseCourse', () => {
  const validYAML = `
subject: Test Subject
time_budget_hours: 20
target_level: beginner
domain: programming
prerequisites:
  - basic math
learning_objectives:
  - Understand X
  - Understand Y
modules:
  - id: "01"
    name: Intro
    time_hours: 2
    prerequisites: []
    topics:
      - basics
  - id: "02"
    name: Advanced
    time_hours: 3
    prerequisites:
      - 1
    topics:
      - advanced
`;

  test('parses valid YAML', () => {
    const result = parseCourse(validYAML, 'test-subject');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-subject');
    expect(result!.course).toBe('Test Subject');
    expect(result!.timeBudgetHours).toBe(20);
    expect(result!.targetLevel).toBe('beginner');
    expect(result!.domain).toBe('programming');
    expect(result!.prerequisites).toEqual(['basic math']);
    expect(result!.learningObjectives).toEqual(['Understand X', 'Understand Y']);
    expect(result!.modules).toHaveLength(2);
    expect(result!.modules[0].id).toBe('01');
    expect(result!.modules[0].name).toBe('Intro');
    expect(result!.modules[0].timeHours).toBe(2);
    expect(result!.modules[1].prerequisites).toEqual(['01']);
    expect(result!.modules[1].topics).toEqual(['advanced']);
  });

  test('returns null for empty input', () => {
    expect(parseCourse('', 'test')).toBeNull();
  });

  test('returns null for missing subject field', () => {
    expect(parseCourse('name: no-subject', 'test')).toBeNull();
  });

  test('handles missing optional fields', () => {
    const result = parseCourse('subject: Minimal', 'minimal');
    expect(result).not.toBeNull();
    expect(result!.timeBudgetHours).toBe(40);
    expect(result!.targetLevel).toBe('intermediate');
    expect(result!.domain).toBe('');
    expect(result!.prerequisites).toEqual([]);
    expect(result!.learningObjectives).toEqual([]);
    expect(result!.modules).toEqual([]);
  });
});

describe('parseQuiz', () => {
  const validYAML = `
- id: q1
  question: What is 2+2?
  options:
    A: "3"
    B: "4"
    C: "5"
  answer: B
  explanation: Basic math
  difficulty: 1
  tags:
    - math
- id: q2
  question: What is water?
  options:
    A: H2O
    B: CO2
  answer: A
  explanation: Chemistry
  difficulty: 2
  tags:
    - chemistry
`;

  test('parses valid quiz YAML', () => {
    const result = parseQuiz(validYAML);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('q1');
    expect(result[0].question).toBe('What is 2+2?');
    expect(result[0].options).toEqual({ A: '3', B: '4', C: '5' });
    expect(result[0].answer).toBe('B');
    expect(result[0].explanation).toBe('Basic math');
    expect(result[0].difficulty).toBe(1);
    expect(result[0].tags).toEqual(['math']);
    expect(result[1].id).toBe('q2');
    expect(result[1].answer).toBe('A');
  });

  test('returns empty array for non-array YAML', () => {
    expect(parseQuiz('key: value')).toEqual([]);
  });

  test('returns empty array for empty input', () => {
    expect(parseQuiz('')).toEqual([]);
  });

  test('parses cloze type from quiz YAML', () => {
    const yaml = `
- id: 1
  type: cloze
  question: "The ___ process removes duplicates."
  answer: "deduplication"
  explanation: "Deduplication removes duplicate records."
  difficulty: 2
  tags:
    - data
`;
    const result = parseQuiz(yaml);
    expect(result[0].type).toBe('cloze');
    expect(result[0].options).toEqual({});
  });

  test('defaults to undefined type for standard questions', () => {
    const yaml = `
- id: 1
  question: "What is X?"
  options:
    a: "A"
    b: "B"
  answer: "a"
  explanation: "Because"
  difficulty: 1
  tags: []
`;
    const result = parseQuiz(yaml);
    expect(result[0].type).toBeUndefined();
  });
});

describe('parseSections', () => {
  test('parses markdown headings', () => {
    const md = `
# Title

Some text

## Section 1

Content

### Subsection

More

## Section 2

Last
`;
    const sections = parseSections(md);
    expect(sections).toHaveLength(4);
    expect(sections[0]).toEqual({ id: 'title', heading: 'Title', level: 1, parentID: null });
    expect(sections[1]).toEqual({
      id: 'section-1',
      heading: 'Section 1',
      level: 2,
      parentID: 'title',
    });
    expect(sections[2]).toEqual({
      id: 'subsection',
      heading: 'Subsection',
      level: 3,
      parentID: 'section-1',
    });
    expect(sections[3]).toEqual({
      id: 'section-2',
      heading: 'Section 2',
      level: 2,
      parentID: 'title',
    });
  });

  test('handles empty markdown', () => {
    expect(parseSections('')).toEqual([]);
  });

  test('handles markdown without headings', () => {
    expect(parseSections('Just a paragraph.\n\nAnother one.')).toEqual([]);
  });

  test('generates correct parent for sibling headings', () => {
    const md = `
## A
## B
### B1
## C
`;
    const sections = parseSections(md);
    expect(sections[0].parentID).toBeNull();
    expect(sections[1].parentID).toBeNull();
    expect(sections[2].parentID).toBe('b');
    expect(sections[3].parentID).toBeNull();
  });

  test('normalizes heading IDs (removes punctuation)', () => {
    const md = `# Hello, World! (test): Part 1`;
    const sections = parseSections(md);
    expect(sections[0].id).toBe('hello-world-test-part-1');
  });

  test('ignores headings inside code blocks', () => {
    const md = `
# Real Heading

\`\`\`
# fake heading
\`\`\`

## Real Subsection

\`\`\`bash
# bash comment
echo hi

## section-like in code block
\`\`\`

### Real Nested
`;
    const sections = parseSections(md);
    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe('Real Heading');
    expect(sections[1].heading).toBe('Real Subsection');
    expect(sections[2].heading).toBe('Real Nested');
  });
});

describe('createSRSCard', () => {
  const q: QuizQuestion = {
    id: 'q1',
    question: 'What is 2+2?',
    options: { A: '3', B: '4' },
    answer: 'B',
    explanation: 'Basic math',
    difficulty: 1,
    tags: ['math'],
  };

  test('creates card with correct fields', () => {
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const card = createSRSCard(q, '01', 'math', fixedDate);
    expect(card.id).toBe('math-01-q1');
    expect(card.questionId).toBe('q1');
    expect(card.moduleId).toBe('01');
    expect(card.courseId).toBe('math');
    expect(card.question).toBe('What is 2+2?');
    expect(card.answer).toBe('B. 4');
    expect(card.explanation).toBe('Basic math');
    expect(card.easeFactor).toBe(2.5);
    expect(card.interval).toBe(0);
    expect(card.repetitions).toBe(0);
    expect(card.nextReviewDate).toBe('2024-01-01T00:00:00.000Z');
    expect(card.lastReviewed).toBeNull();
    expect(card.isStarred).toBe(false);
  });

  test('appends option text to answer', () => {
    const q2: QuizQuestion = { ...q, answer: 'A', options: { A: '3', B: '4' } };
    const card = createSRSCard(q2, '01', 'math', new Date('2024-01-01'));
    expect(card.answer).toBe('A. 3');
  });
});

describe('performReview', () => {
  const baseCard: SRSCard = {
    id: 'test-1-q1',
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
  };

  const fixedDate = new Date('2024-06-15T12:00:00Z');
  const nextDay = new Date('2024-06-16T12:00:00Z');

  test('correct answer: sets stability, difficulty, interval (first time)', () => {
    const result = performReview(baseCard, true, fixedDate);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBeGreaterThan(0);
    expect(result.stability).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThan(0);
    expect(result.lastReviewed).toBe('2024-06-15T12:00:00.000Z');
  });

  test('correct answer: second review grows interval', () => {
    const card = {
      ...baseCard,
      lastReviewed: '2024-06-15T12:00:00.000Z',
      repetitions: 1,
      interval: 2,
      stability: 2.5,
      difficulty: 5,
      state: 'Review' as const,
    };
    const result = performReview(card, true, nextDay);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBeGreaterThanOrEqual(card.interval);
  });

  test('incorrect answer: drops stability, increments lapses', () => {
    const card = {
      ...baseCard,
      lastReviewed: '2024-06-15T12:00:00.000Z',
      repetitions: 5,
      interval: 30,
      stability: 20,
      difficulty: 4,
      state: 'Review' as const,
      lapses: 0,
    };
    const result = performReview(card, false, nextDay);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBeLessThan(card.interval);
    expect(result.stability).toBeLessThan(card.stability!);
    expect(result.lapses).toBe(1);
    expect(result.lastReviewed).toBe('2024-06-16T12:00:00.000Z');
  });

  test('ease factor stays >= 1.3', () => {
    const card = {
      ...baseCard,
      lastReviewed: '2024-06-15T12:00:00.000Z',
      stability: 10,
      difficulty: 9,
      state: 'Review' as const,
    };
    const result = performReview(card, false, nextDay);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  test('does not mutate original card', () => {
    const original = { ...baseCard };
    const result = performReview(baseCard, true, fixedDate);
    expect(original.repetitions).toBe(0);
    expect(result.repetitions).toBe(1);
  });
});

describe('parseCumulativeQuiz', () => {
  test('parses valid YAML sequence into questions', () => {
    const yaml = `
- type: mcq
  question: What is X?
  options:
    A: "1"
    B: "2"
    C: "3"
  answer: A
- type: cloze
  text: The {answer} is 42
  answer: answer
- type: tf
  question: Is this true?
  answer: True
`;
    const result = parseCumulativeQuiz(yaml);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].type).toBeUndefined();
    expect(result.questions[1].type).toBe('cloze');
    expect(result.questions[2].type).toBe('tf');
  });

  test('returns empty array for empty input', () => {
    expect(parseCumulativeQuiz('').questions).toEqual([]);
  });

  test('returns empty array for non-sequence YAML', () => {
    expect(parseCumulativeQuiz('key: value').questions).toEqual([]);
  });

  test('returns empty array for invalid YAML', () => {
    expect(parseCumulativeQuiz('[[[').questions).toEqual([]);
  });
});
