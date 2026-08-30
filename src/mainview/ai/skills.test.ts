import { describe, expect, test } from 'bun:test';

import { AI_SKILLS, drillToYaml, parseDrillOutput } from './skills';

describe('AI_SKILLS', () => {
  test('exports three skills in declared order', () => {
    expect(AI_SKILLS.map((s) => s.id)).toEqual(['feynman', 'reframe', 'drill']);
    expect(AI_SKILLS).toHaveLength(3);
  });

  test('feynman prompt includes user explanation, persona, context, and optional hint', () => {
    const feynman = AI_SKILLS.find((s) => s.id === 'feynman')!;
    const out = feynman.buildPrompt('lesson body', 'analogy', 'my try');
    expect(out).toContain('my try\n');
    expect(out).toContain('curious 12-year-old');
    expect(out).toContain('Topic hint: analogy');
    expect(out).toContain('--- Lesson ---');
    expect(out).toContain('lesson body');
  });

  test('feynman prompt omits hint line when absent and omits explanation line when undefined', () => {
    const feynman = AI_SKILLS.find((s) => s.id === 'feynman')!;
    const out = feynman.buildPrompt('lesson');
    expect(out).not.toContain('Topic hint:');
    expect(out).toContain('curious 12-year-old');
  });

  test('reframe prompt includes Socratic persona, 3-section output directive, optional hint', () => {
    const reframe = AI_SKILLS.find((s) => s.id === 'reframe')!;
    const out = reframe.buildPrompt('lesson', 'different angle');
    expect(out).toContain('Socratic coach');
    expect(out).toContain('Reframe hint: different angle');
    expect(out).toContain('alternative reframe');
    expect(out).toContain('strengths vs original framing');
    expect(out).toContain('where reframe breaks down');
    expect(out).toContain('--- Lesson ---');
  });

  test('drill prompt includes quizmaster persona, 5-question mix directive, optional hint', () => {
    const drill = AI_SKILLS.find((s) => s.id === 'drill')!;
    const out = drill.buildPrompt('lesson', 'core concept');
    expect(out).toContain('quizmaster');
    expect(out).toContain('5 practice questions');
    expect(out).toContain('recall (2), application (2), analysis (1)');
    expect(out).toContain('Topic hint: core concept');
    expect(out).toContain('--- Lesson ---');
  });

  describe('parseDrillOutput / drillToYaml', () => {
    test('parses numbered Q/A/Explanation blocks, skips incomplete ones', () => {
      const text = [
        'Here are your questions:',
        '',
        '1. Q: What does the indexer do?',
        'A: Parses and stores events',
        'Explanation: The indexer is the storage brain.',
        '',
        '2. Q: Incomplete block only',
        '',
        '3. Q: What runs on the edge?',
        'A: A forwarder',
      ].join('\n');
      const { questions, invalid } = parseDrillOutput(text);
      expect(questions).toHaveLength(2);
      expect(invalid).toBe(1);
      expect(questions[0].question).toBe('What does the indexer do?');
      expect(questions[0].answer).toBe('Parses and stores events');
      expect(questions[0].explanation).toBe('The indexer is the storage brain.');
      expect(questions[1].explanation).toBe('');
    });

    test('continuation lines append to the current field', () => {
      const { questions } = parseDrillOutput('Q: long question\nspanning lines\nA: answer');
      expect(questions[0].question).toBe('long question spanning lines');
    });

    test('drillToYaml emits {blank}-directive cloze entries', () => {
      const yaml = drillToYaml([
        { question: 'What does the indexer do?', answer: 'parses events', explanation: 'why' },
      ]);
      expect(yaml).toContain('- id: "drill.1"');
      expect(yaml).toContain('"What does the indexer do? {blank}"');
      expect(yaml).toContain('"parses events"');
      expect(yaml).toContain('"why"');
    });

    test('drillToYaml omits empty explanation', () => {
      const yaml = drillToYaml([{ question: 'Q', answer: 'A', explanation: '' }]);
      expect(yaml).not.toContain('explanation');
    });
  });
});
