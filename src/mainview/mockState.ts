export const mockResponses = new Map<string, unknown>();
export const mockSequences = new Map<string, unknown[]>();
export const mockDelays = new Map<string, number>();

export const defaultMocks: Record<string, unknown> = {
  setWindowTitle: undefined,
  openExternal: { ok: true },
  getDueCardsCount: 0,
  quizIndex: { modules: {}, cumulativeQuizzes: [] },
};

export function clearMocks() {
  mockResponses.clear();
  mockSequences.clear();
  mockDelays.clear();
}

export function mockResponse(method: string, data: unknown) {
  mockResponses.set(method, data);
  mockSequences.delete(method);
  mockDelays.delete(method);
}

export function mockResponseSequence(method: string, values: unknown[]) {
  mockSequences.set(method, [...values]);
  mockResponses.delete(method);
  mockDelays.delete(method);
}

export function mockResponseError(method: string, message: string) {
  mockResponses.set(method, new Error(message));
  mockSequences.delete(method);
  mockDelays.delete(method);
}

export function mockResponseDelay(method: string, ms: number, data?: unknown) {
  mockDelays.set(method, ms);
  if (data !== undefined) {
    mockResponses.set(method, data);
    mockSequences.delete(method);
  } else {
    if (!mockSequences.has(method) && !mockResponses.has(method)) {
      mockResponses.set(method, undefined);
    }
  }
}

export function resolveMockResponse(method: string): Promise<unknown> {
  const seq = mockSequences.get(method);
  if (seq && seq.length) {
    const next = seq.shift();
    if (seq.length === 0) mockSequences.set(method, [next!]);
    return wrapWithDelay(method, next);
  }

  if (mockResponses.has(method)) {
    return wrapWithDelay(method, mockResponses.get(method));
  }

  if (method in defaultMocks) return wrapWithDelay(method, defaultMocks[method]);
  return Promise.reject(new Error(`No mock for ${method}`));
}

function wrapWithDelay(method: string, value: unknown): Promise<unknown> {
  const delay = mockDelays.get(method);
  if (typeof value === 'function') {
    const p = (value as (p: unknown) => Promise<unknown>)(undefined);
    return delay ? p.then((v) => wait(delay).then(() => v)) : p;
  }
  if (value instanceof Error) {
    return delay ? wait(delay).then(() => Promise.reject(value)) : Promise.reject(value);
  }
  return delay ? wait(delay).then(() => value) : Promise.resolve(value);
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
