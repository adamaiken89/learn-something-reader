import { afterEach, describe, expect, test } from 'bun:test';

import {
  clearMocks,
  defaultMocks,
  mockResponse,
  mockResponseDelay,
  mockResponseError,
  mockResponseSequence,
  resolveMockResponse,
} from './mockState';

afterEach(() => clearMocks());

describe('mockState', () => {
  test('mockResponse stores value; clearMocks removes', async () => {
    mockResponse('foo', 42);
    expect(await resolveMockResponse('foo')).toBe(42);
    clearMocks();
    await expect(resolveMockResponse('foo')).rejects.toThrow('No mock for foo');
  });

  test('mockResponse(undefined) is still retrievable', () => {
    mockResponse('foo', undefined);
    return expect(resolveMockResponse('foo')).resolves.toBeUndefined();
  });

  test('mockResponseSequence returns values in order, repeats last after exhaustion', async () => {
    mockResponseSequence('foo', [1, 2, 3]);
    expect(await resolveMockResponse('foo')).toBe(1);
    expect(await resolveMockResponse('foo')).toBe(2);
    expect(await resolveMockResponse('foo')).toBe(3);
    expect(await resolveMockResponse('foo')).toBe(3);
  });

  test('mockResponseError rejects with given message', () => {
    mockResponseError('foo', 'boom');
    return expect(resolveMockResponse('foo')).rejects.toThrow('boom');
  });

  test('mockResponseDelay resolves after delay', async () => {
    mockResponseDelay('foo', 30, 'hi');
    const start = Date.now();
    const v = await resolveMockResponse('foo');
    expect(v).toBe('hi');
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });

  test('mockResponseDelay without data resolves to undefined after delay', async () => {
    mockResponseDelay('foo', 10);
    const v = await resolveMockResponse('foo');
    expect(v).toBeUndefined();
  });

  test('defaultMocks used when no override set', async () => {
    expect(await resolveMockResponse('getDueCardsCount')).toBe(defaultMocks.getDueCardsCount);
  });

  test('defaultMocks used for setWindowTitle → undefined', async () => {
    expect(await resolveMockResponse('setWindowTitle')).toBeUndefined();
  });

  test('throws No mock for unmocked method', () => {
    return expect(resolveMockResponse('totallyUnknown')).rejects.toThrow(
      'No mock for totallyUnknown',
    );
  });

  test('mockResponseSequence wraps in delay when set', async () => {
    mockResponseSequence('foo', [10, 20]);
    mockResponseDelay('foo', 20);
    const v = await resolveMockResponse('foo');
    expect(v).toBe(10);
  });

  test('function-valued responses are invoked', async () => {
    mockResponse('foo', (_p: unknown) => Promise.resolve({ in: 'fn' }));
    expect(await resolveMockResponse('foo')).toEqual({ in: 'fn' });
  });

  test('mockResponseError wrapped in delay rejects after delay', async () => {
    mockResponseError('foo', 'late');
    mockResponseDelay('foo', 5);
    const start = Date.now();
    await expect(resolveMockResponse('foo')).rejects.toThrow('late');
    expect(Date.now() - start).toBeGreaterThanOrEqual(3);
  });
});
