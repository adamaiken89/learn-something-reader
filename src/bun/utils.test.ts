import { afterEach, describe, expect, test } from 'bun:test';

import { fsMockImpl } from '../testFsShared';

import { findSubjectsDir, normalizeModuleId } from './utils';

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
  afterEach(() => {
    Object.assign(fsMockImpl, {
      existsSync: () => false,
      mkdirSync: () => {},
    });
  });

  test('returns module-adjacent subjects dir when it exists', () => {
    Object.assign(fsMockImpl, {
      existsSync: (p: string) => p.endsWith('/subjects') && !p.endsWith('/../subjects'),
      mkdirSync: () => {},
    });
    const dir = findSubjectsDir();
    expect(dir).toContain('subjects');
    expect(dir).not.toContain('..');
  });

  test('falls back to parent subjects dir when adjacent missing', () => {
    Object.assign(fsMockImpl, {
      existsSync: (p: string) => p.includes('../subjects'),
      mkdirSync: () => {},
    });
    const dir = findSubjectsDir();
    expect(dir).toContain('subjects');
  });

  test('falls back to COURSES_DIR (mkdir) when neither exists', () => {
    Object.assign(fsMockImpl, {
      existsSync: () => false,
      mkdirSync: () => {},
    });
    const dir = findSubjectsDir();
    expect(dir).toContain('.coursereader');
    expect(dir).toContain('subjects');
  });
});
