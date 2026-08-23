// Direct devkit import (no resolve.alias): Hutch projects the SDK into
// .hutch/devkit; the npm electrobun package is a bootstrap-only stub in 2.x.
// Run `bunx electrobun sync` once after cloning before building/testing.
import { Electroview } from '../../.hutch/devkit/api/browser/index';
import type { AppSchema } from '../bun/rpcSchema';

const rpcInstance = Electroview.defineRPC<AppSchema>({
  maxRequestTime: 30000,
  handlers: {
    requests: {},
    messages: {},
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof window !== 'undefined' && (window as any).__electrobun) {
  new Electroview({ rpc: rpcInstance });
}

export const rpc = rpcInstance;
