import { act } from '@testing-library/react';
import { beforeAll } from 'bun:test';

import { __setRPC } from './api';
import { clearMocks, defaultMocks, mockResponses } from './mockState';

const mockRPC = {
  request: new Proxy({} as Record<string, (p: unknown) => Promise<unknown>>, {
    get(_, method: string) {
      return (params: unknown) => {
        if (mockResponses.has(method)) {
          const response = mockResponses.get(method);
          if (typeof response === 'function')
            return (response as (p: unknown) => Promise<unknown>)(params);
          if (response instanceof Error) return Promise.reject(response);
          return Promise.resolve(response);
        }
        if (method in defaultMocks) return Promise.resolve(defaultMocks[method]);
        return Promise.reject(new Error(`No mock for ${method}`));
      };
    },
  }),
};

export function mockResponse(method: string, data: unknown) {
  mockResponses.set(method, data);
}

export function deleteMock(method: string) {
  mockResponses.delete(method);
}

export function hasMock(method: string): boolean {
  return mockResponses.has(method);
}

export function pressKey(key: string, options?: { ctrl?: boolean; meta?: boolean }) {
  const event = new window.KeyboardEvent('keydown', {
    key,
    code: key === ' ' ? 'Space' : key,
    keyCode: key === 'Escape' ? 27 : key === ' ' ? 32 : key.length === 1 ? key.charCodeAt(0) : 0,
    bubbles: true,
    cancelable: true,
    ctrlKey: options?.ctrl ?? false,
    metaKey: options?.meta ?? false,
  });
  void act(() => window.dispatchEvent(event));
}

export { clearMocks };

export function setupRPC(rpc?: { request: Record<string, (p: unknown) => Promise<unknown>> }) {
  beforeAll(() => __setRPC(rpc ?? mockRPC));
}
