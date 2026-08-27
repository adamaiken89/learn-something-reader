import { describe, expect, test } from 'bun:test';

import { extractSkillSection, PERPLEXITY_PLACEHOLDER, processLessonContent } from './lessonContent';

const DOC = [
  '# Lesson',
  '',
  'Intro paragraph.',
  '',
  '## Core Idea',
  '',
  'Core explanation.',
  '',
  '## Feynman Explain',
  '',
  'Seed analogy goes here.',
  '',
  '## Reframe',
  '',
  'Seed framing goes here.',
  '',
  '## Drill',
  '',
  'Practice seed questions.',
].join('\n');

describe('processLessonContent', () => {
  test('plain content without skill sections is unchanged', () => {
    const src = '# Lesson\n\nJust prose.\n';
    expect(processLessonContent(src)).toBe(src);
  });

  test('removes Drill section entirely (mid-document)', () => {
    const out = processLessonContent(DOC);
    expect(out).not.toContain('Drill');
    expect(out).not.toContain('Practice seed questions.');
  });

  test('removes Drill section at end of document', () => {
    const src = '# L\n\n## Alpha\n\nA body.\n\n## Drill\n\nD body.';
    const out = processLessonContent(src);
    expect(out).not.toContain('Drill');
    expect(out).not.toContain('D body.');
    expect(out).toContain('A body.');
  });

  test('keeps Feynman Explain content and appends feynman placeholder', () => {
    const out = processLessonContent(DOC);
    expect(out).toContain('Seed analogy goes here.');
    expect(out).toContain(`${PERPLEXITY_PLACEHOLDER}feynman`);
  });

  test('keeps Reframe content and appends reframe placeholder', () => {
    const out = processLessonContent(DOC);
    expect(out).toContain('Seed framing goes here.');
    expect(out).toContain(`${PERPLEXITY_PLACEHOLDER}reframe`);
  });

  test('full pipeline preserves non-skill sections in order', () => {
    const out = processLessonContent(DOC);
    const idxIntro = out.indexOf('Intro paragraph.');
    const idxCore = out.indexOf('Core explanation.');
    const idxFeyn = out.indexOf('Seed analogy');
    const idxRefr = out.indexOf('Seed framing');
    expect(idxIntro).toBeGreaterThanOrEqual(0);
    expect(idxIntro < idxCore).toBe(true);
    expect(idxCore < idxFeyn).toBe(true);
    expect(idxFeyn < idxRefr).toBe(true);
    expect(out).toContain('## Core Idea');
  });

  test('missing sections produce no placeholders', () => {
    const src = '# L\n\n## Only\n\nBody.';
    const out = processLessonContent(src);
    expect(out).toBe(src);
    expect(out).not.toContain(PERPLEXITY_PLACEHOLDER);
  });
});

describe('extractSkillSection', () => {
  test('returns trimmed body without heading line', () => {
    expect(extractSkillSection(DOC, 'Feynman Explain')).toBe('Seed analogy goes here.');
  });

  test('returns undefined when section absent', () => {
    expect(extractSkillSection('# L\n\nNo skills.', 'Drill')).toBeUndefined();
  });

  test('section running to end of file is captured fully', () => {
    const src = '# L\n\n## Reframe\n\nLine one.\nLine two.';
    expect(extractSkillSection(src, 'Reframe')).toBe('Line one.\nLine two.');
  });

  test('placeholder constant has expected literal value', () => {
    expect(PERPLEXITY_PLACEHOLDER).toBe('%%PERPLEXITY%%:');
  });
});
