import { describe, expect, spyOn, test, mock, afterEach } from 'bun:test';

const storage = await import('./src/bun/storage');

test('spyOn storage.getGeminiKey', () => {
  const spy = spyOn(storage, 'getGeminiKey').mockImplementation(() => null);
  expect(storage.getGeminiKey()).toBeNull();
  spy.mockRestore();
});
