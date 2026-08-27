import { describe, expect, test } from 'bun:test';

import { fsMockImpl } from '../testFsShared';
import { normalizeModuleId, findSubjectsDir } from './utils';

describe('normalizeModuleId', () => {
  test('pads number with leading zero', () => {
    expect(normalizeModuleId(1)).toBe('01');
    expect(normalizeModuleId(9)).toBe('09');
  });

  test('pads double-digit number', () => {
    expect(normalizeModuleId(10)).toBe('10');
  });

  test.each([
    { input: 0, expected: '00' },
    { input: 100, expected: '100' },
  ])('number %i → %p', ({ input, expected }) => {
    expect(normalizeModuleId(input)).toBe(expected);
  });

  test('returns string id unchanged', () => {
    expect(normalizeModuleId('01-hello')).toBe('01-hello');
  });

  test('handles empty string', () => {
    expect(normalizeModuleId('')).toBe('');
  });
});

describe('findSubjectsDir', () => {
  test('prefers first existing dev candidate over ~/.coursereader fallback', () => {
    const checkedPaths: string[] = [];
    Object.assign(fsMockImpl, {
      existsSync: (p: string) => {
        checkedPaths.push(p);
        return checkedPaths.length === 1;
      },
      mkdirSync: () => {
        throw new Error('should not mkdirSync when a candidate exists');
      },
    });
    const dir = findSubjectsDir();
    expect(checkedPaths).toHaveLength(1);
    expect(dir).toBe(checkedPaths[0]);
  });

  test('falls back to ~/.coursereader/subjects when both dev dirs missing', () => {
    Object.assign(fsMockImpl, {
      existsSync: () => false,
      mkdirSync: () => {},
      readFileSync: () => '',
    });
    const dir = findSubjectsDir();
    expect(dir.includes('.coursereader')).toBe(true);
  });
});
