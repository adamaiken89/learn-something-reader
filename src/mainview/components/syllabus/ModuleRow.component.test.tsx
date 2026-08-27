import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'bun:test';

import type { ModuleMeta } from '../../../bun/types';
import ModuleRow from './ModuleRow';

function makeModule(id: string, name: string, overrides: Partial<ModuleMeta> = {}): ModuleMeta {
  return {
    id,
    name,
    timeHours: 2,
    prerequisites: [],
    topics: [],
    ...overrides,
  };
}

const MODS = [
  makeModule('1', 'Getting Started'),
  makeModule('2', 'Deep Dive'),
  makeModule('3', 'Wrap Up'),
];

const ATTEMPT_BASE = {
  attempted: true,
  score: 1,
  total: 2,
  date: '2026-01-01',
};

async function renderRow(
  props: Partial<Parameters<typeof ModuleRow>[0]> = {},
  mod: ModuleMeta = MODS[1],
) {
  const utils = render(
    <ModuleRow
      mod={mod}
      index={1}
      courseModules={MODS}
      isCompleted={false}
      hasQuiz={false}
      attempt={null}
      srsDueCount={0}
      onOpen={() => {}}
      onOpenQuiz={() => {}}
      {...props}
    />,
  );
  return utils;
}

beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

afterEach(() => {
  cleanup();
});

test('renders module name via testid and 1-based position number when incomplete', async () => {
  const { getByTestId, getByText } = await renderRow();
  expect(getByTestId('module-name').textContent).toBe('Deep Dive');
  expect(getByText('2')).toBeTruthy();
});

test('completed module hides position number', async () => {
  const { queryByText } = await renderRow({ isCompleted: true });
  expect(queryByText('2')).toBeNull();
});

test('shows hours when timeHours > 0, hidden when zero', async () => {
  const { queryByText } = await renderRow({}, makeModule('2', 'Deep Dive', { timeHours: 3 }));
  expect(queryByText('3h')).toBeTruthy();
  const none = await renderRow({}, makeModule('9', 'Free', { timeHours: 0 }));
  expect(none.queryByText('0h')).toBeNull();
});

test('topics capped at five with +N overflow chip', async () => {
  const six = ['a', 'b', 'c', 'd', 'e', 'f'];
  const { queryByText } = await renderRow({}, makeModule('2', 'Deep Dive', { topics: six }));
  expect(queryByText('+1')).toBeTruthy();
  expect(queryByText('f')).toBeNull();
});

test('prerequisite ids resolve to module names, unknown ids fall back raw', async () => {
  const mod = makeModule('2', 'Deep Dive', { prerequisites: ['1', 'zzz'] });
  const { container } = await renderRow({}, mod);
  expect(container.textContent).toContain('Prereq:');
  expect(container.textContent).toContain('Getting Started');
  expect(container.textContent).toContain('zzz');
});

test('overdue attempt shows Quiz overdue badge', async () => {
  const { container } = await renderRow({
    attempt: { ...ATTEMPT_BASE, due: true, overdue: true, ready: false },
  });
  expect(container.textContent).toContain('Quiz overdue');
});

test('due-but-ready attempt shows Quiz ready badge', async () => {
  const { container } = await renderRow({
    attempt: { ...ATTEMPT_BASE, due: true, overdue: false, ready: true },
  });
  expect(container.textContent).toContain('Quiz ready');
});

test('no badge without due attempt or srs due count', async () => {
  const { container } = await renderRow({
    attempt: { ...ATTEMPT_BASE, due: false, overdue: false, ready: false },
    srsDueCount: 0,
  });
  expect(container.textContent).not.toContain('cards due');
});

test('srs due count renders N cards due badge', async () => {
  const { container } = await renderRow({ srsDueCount: 3 });
  expect(container.textContent).toContain('3 cards due');
});

test('MCQ button rendered only when hasQuiz, click opens quiz without opening row', async () => {
  const quizOpens: string[] = [];
  const rowOpens: string[] = [];
  const { container } = await renderRow({
    hasQuiz: true,
    onOpen: (m) => {
      rowOpens.push(m.id);
    },
    onOpenQuiz: (m) => {
      quizOpens.push(m.id);
    },
  });
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('MCQ'),
  );
  btn!.click();
  expect(quizOpens).toEqual(['2']);
  expect(rowOpens).toEqual([]);

  const plain = await renderRow({ hasQuiz: false });
  expect(Array.from(plain.container.querySelectorAll('button')).length).toBe(0);
});
