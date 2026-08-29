import { beforeAll } from 'bun:test';

import { __setRPC } from './api';
import {
  clearMocks,
  defaultMocks,
  mockDelays,
  mockResponses,
  mockSequences,
  resolveMockResponse,
} from './mockState';

const mockRPC = {
  request: new Proxy({} as Record<string, (p: unknown) => Promise<unknown>>, {
    get(_, method: string) {
      return (params: unknown) => {
        if (
          mockSequences.has(method) ||
          mockDelays.has(method) ||
          mockResponses.has(method) ||
          method in defaultMocks
        ) {
          return resolveMockResponse(method);
        }
        if (typeof params === 'function' || params !== undefined) {
          return resolveMockResponse(method);
        }
        return Promise.reject(new Error(`No mock for ${method}`));
      };
    },
  }),
};

export function mockResponse(method: string, data: unknown) {
  mockResponses.set(method, data);
  mockSequences.delete(method);
  mockDelays.delete(method);
}

export function deleteMock(method: string) {
  mockResponses.delete(method);
  mockSequences.delete(method);
  mockDelays.delete(method);
}

export function hasMock(method: string): boolean {
  return mockResponses.has(method) || mockSequences.has(method);
}

export { clearMocks };

export function setupRPC(rpc?: { request: Record<string, (p: unknown) => Promise<unknown>> }) {
  beforeAll(() => __setRPC(rpc ?? mockRPC));
}
