import { describe, expect, test } from 'bun:test';

import { AI_SKILLS } from './skills';

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
});
