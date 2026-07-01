import { describe, expect, test } from 'bun:test';

import { normalizeModuleId } from './utils';

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
