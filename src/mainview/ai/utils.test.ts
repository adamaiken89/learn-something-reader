import { beforeEach, describe, expect, spyOn, test } from 'bun:test';

import { api } from '../api';
import { clearMocks, deleteMock, setupRPC } from '../testUtils';
import { logAiSkillUsage, stripContentForAI } from './utils';

setupRPC();

beforeEach(() => {
  clearMocks();
});

describe('logAiSkillUsage', () => {
  test('logs an ai_skill session (fire-and-forget success)', async () => {
    const calls: unknown[] = [];
    const spy = spyOn(api.stats, 'logSession').mockImplementation((data) => {
      calls.push(data);
      return Promise.resolve({ ok: true as const });
    });
    try {
      logAiSkillUsage('math', '01');
      await new Promise((r) => setTimeout(r, 0));
      expect(calls).toEqual([
        { courseID: 'math', moduleID: '01', durationMinutes: 1, type: 'ai_skill' },
      ]);
    } finally {
      spy.mockRestore();
    }
  });

  test('swallows logSession failures', async () => {
    deleteMock('logSession');
    expect(() => logAiSkillUsage('math', '01')).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe('stripContentForAI', () => {
  test('removes mermaid blocks and AI skill sections', () => {
    const md = [
      '## Intro',
      '',
      'Real content stays.',
      '',
      '```mermaid',
      'graph TD; A-->B;',
      '```',
      '',
      '## Drill',
      'hidden drill seeds',
      '',
      '## Feynman Explain',
      'hidden analogy',
      '',
      '## Next',
      'tail content',
    ].join('\n');
    const out = stripContentForAI(md);
    expect(out).toContain('Real content stays.');
    expect(out).toContain('tail content');
    expect(out).not.toContain('mermaid');
    expect(out).not.toContain('hidden drill');
    expect(out).not.toContain('hidden analogy');
  });
});
