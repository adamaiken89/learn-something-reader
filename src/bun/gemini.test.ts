import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

import * as storageModule from './storage';

let mockKey: string | null = null;

const originalFetch = globalThis.fetch;

let gemini: typeof import('./gemini');

beforeEach(() => {
  globalThis.fetch = originalFetch;
  mockKey = null;
});

// NOTE: no mock.restore() — would destroy setup.tsx's global mocks
describe('hasAPIKey', () => {
  test('returns false when no key set', async () => {
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => null);
    gemini = await import('./gemini');
    expect(gemini.hasAPIKey()).toBe(false);
  });

  test('returns true when key set', async () => {
    mockKey = 'test-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    gemini = await import('./gemini');
    expect(gemini.hasAPIKey()).toBe(true);
  });
});

describe('setAPIKey', () => {
  test('saves key via storage', async () => {
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => null);
    spyOn(storageModule, 'setGeminiKey').mockImplementation((key: string) => {
      mockKey = key;
    });
    gemini = await import('./gemini');
    gemini.setAPIKey('my-key');
    expect(mockKey).toBe('my-key');
  });
});

describe('askGemini', () => {
  test('throws when no API key set', async () => {
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => null);
    gemini = await import('./gemini');
    expect(gemini.askGemini('question', 'context')).rejects.toThrow('No API key set');
  });

  test('returns text on successful API call', async () => {
    mockKey = 'valid-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Here is the answer' }] } }],
          }),
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    gemini = await import('./gemini');
    const result = await gemini.askGemini('what is x?', 'context about x');
    expect(result).toBe('Here is the answer');
  });

  test('throws on API error response', async () => {
    mockKey = 'valid-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    gemini = await import('./gemini');
    expect(gemini.askGemini('q', 'c')).rejects.toThrow('API error (400)');
  });

  test('throws on empty response', async () => {
    mockKey = 'valid-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    gemini = await import('./gemini');
    expect(gemini.askGemini('q', 'c')).rejects.toThrow('Invalid response from API');
  });

  test('throws on missing text in response', async () => {
    mockKey = 'valid-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{}] } }],
          }),
      } as Response),
    ) as unknown as typeof globalThis.fetch;

    gemini = await import('./gemini');
    expect(gemini.askGemini('q', 'c')).rejects.toThrow('Invalid response from API');
  });

  test('throws on network failure', async () => {
    mockKey = 'valid-key';
    spyOn(storageModule, 'getGeminiKey').mockImplementation(() => mockKey);
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('Network error')),
    ) as unknown as typeof globalThis.fetch;

    gemini = await import('./gemini');
    expect(gemini.askGemini('q', 'c')).rejects.toThrow('Network error');
  });
});
