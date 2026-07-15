import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, mock } from 'bun:test';
import { Window } from 'happy-dom';

import {
  execSyncState,
  fsMockImpl,
  fsMockState,
  mermaidMockImpl,
  mermaidMockState,
  toastMockState,
} from './testFsShared';
expect.extend(jestDomMatchers);

import { clearMocks } from './mainview/mockState';
import { resetAllStores } from './mainview/resetStores';

void mock.module('fs', () => fsMockState);
void mock.module('mermaid', () => mermaidMockState);

// Mock ResizeObserver for @dnd-kit/react
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock @dnd-kit/react — happy-dom lacks Document which @dnd-kit/dom requires
void mock.module('@dnd-kit/react', () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => children,
  DragOverlay: () => null,
  useDraggable: () => ({ ref: () => {}, isDragging: false }),
  useDroppable: () => ({ ref: () => {}, isDropTarget: false }),
}));

class MockElectroview {
  constructor(_config: Record<string, unknown>) {}
  static defineRPC(_config: Record<string, unknown>) {
    return {
      setTransport: () => {},
      setRequestHandler: () => {},
      request: new Proxy((() => Promise.resolve(null)) as (...args: unknown[]) => unknown, {
        get: (_t: (...args: unknown[]) => unknown, method: string) => (_params: unknown) => {
          if (
            method.endsWith('List') ||
            method.endsWith('Notes') ||
            method.endsWith('Highlights') ||
            method.endsWith('Bookmarks') ||
            method.endsWith('Cards') ||
            method.endsWith('Sessions') ||
            method.endsWith('Modules')
          )
            return Promise.resolve([]);
          if (method.endsWith('Deck')) return Promise.resolve({ cards: {} });
          return Promise.resolve(null);
        },
      }),
      send: () => {},
      proxy: { request: {}, send: {} },
      addMessageListener: () => {},
      removeMessageListener: () => {},
    };
  }
}
void mock.module('electrobun/view', () => ({ Electroview: MockElectroview }));

// sonner — intercept toast calls globally
void mock.module('sonner', () => toastMockState);

void mock.module('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

void mock.module('child_process', () => execSyncState);

interface TestGlobals {
  IS_REACT_ACT_ENVIRONMENT: boolean;
  window: Window & typeof globalThis;
  document: Document;
  self: Window & typeof globalThis;
  top: Window & typeof globalThis;
  parent: Window & typeof globalThis;
  location: Location;
  navigator: Navigator;
  localStorage: Storage;
  setTimeout: typeof globalThis.setTimeout;
  clearTimeout: typeof globalThis.clearTimeout;
  setInterval: typeof globalThis.setInterval;
  clearInterval: typeof globalThis.clearInterval;
  URL: typeof globalThis.URL;
  URLSearchParams: typeof globalThis.URLSearchParams;
  crypto: Crypto;
  Event: typeof Event;
  MutationObserver: typeof globalThis.MutationObserver;
  customElements: CustomElementRegistry;
  IntersectionObserver: { new (): { observe(): void; unobserve(): void; disconnect(): void } };
  Range: typeof Range;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
  fetch: (...args: unknown[]) => Promise<unknown>;
  NodeFilter: {
    SHOW_ALL: number;
    SHOW_ELEMENT: number;
    SHOW_TEXT: number;
    SHOW_COMMENT: number;
    SHOW_DOCUMENT: number;
    SHOW_DOCUMENT_TYPE: number;
    SHOW_DOCUMENT_FRAGMENT: number;
    SHOW_PROCESSING_INSTRUCTION: number;
    SHOW_CDATA_SECTION: number;
    SHOW_ENTITY_REFERENCE: number;
    SHOW_ENTITY: number;
    FILTER_ACCEPT: number;
    FILTER_REJECT: number;
    FILTER_SKIP: number;
  };
}

const g: TestGlobals = globalThis as unknown as TestGlobals;

g.IS_REACT_ACT_ENVIRONMENT = true;

const win = new Window() as unknown as Window & typeof globalThis;

g.window = win;
g.document = win.document;
g.self = win;
g.top = win;
g.parent = win;
g.Event = win.Event as typeof Event;
g.location = win.location;
g.navigator = win.navigator;
g.localStorage = win.localStorage;
g.setTimeout = win.setTimeout;
g.clearTimeout = win.clearTimeout;
g.setInterval = win.setInterval;
g.clearInterval = win.clearInterval;
g.URL = win.URL;
g.URLSearchParams = win.URLSearchParams;
g.crypto = win.crypto;
g.MutationObserver = win.MutationObserver;
g.customElements = win.customElements;
g.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
g.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
};
g.cancelAnimationFrame = (_id: number) => {};
g.fetch = async () => new Promise(() => {});
class MockRange {
  commonAncestorContainer: HTMLElement;
  constructor() {
    this.commonAncestorContainer = document.body;
  }
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  }
  setStart() {}
  setEnd() {}
  selectNodeContents() {}
  deleteContents() {}
  extractContents() {
    return document.createDocumentFragment();
  }
  cloneContents() {
    return document.createDocumentFragment();
  }
  insertNode() {}
  surroundContents() {}
  toString() {
    return '';
  }
  cloneRange() {
    return new MockRange();
  }
  collapse() {}
}
g.Range = MockRange as unknown as typeof Range;

g.NodeFilter = {
  SHOW_ALL: -1,
  SHOW_ELEMENT: 1,
  SHOW_TEXT: 4,
  SHOW_COMMENT: 128,
  SHOW_DOCUMENT: 256,
  SHOW_DOCUMENT_TYPE: 512,
  SHOW_DOCUMENT_FRAGMENT: 1024,
  SHOW_PROCESSING_INSTRUCTION: 64,
  SHOW_CDATA_SECTION: 8,
  SHOW_ENTITY_REFERENCE: 16,
  SHOW_ENTITY: 32,
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
  FILTER_SKIP: 3,
};

// Initialize real i18n so useTranslation() returns actual English values in tests
import './mainview/i18n';

afterEach(() => {
  cleanup();
  clearMocks();
  resetAllStores();
  document.body.innerHTML = '';
  localStorage.clear();
  resetAllStores();
  Object.assign(fsMockImpl, {
    existsSync: () => false,
    readFileSync: (_path: string) => '',
    writeFileSync: (_path: string, _data: string) => {},
    appendFileSync: (_path: string, _data: string) => {},
    mkdirSync: () => {},
    readdirSync: () => [] as Array<{ name: string; isDirectory: () => boolean }>,
    unlinkSync: () => {},
    rmSync: () => {},
    cpSync: (_src: string, _dest: string) => {},
  });
  Object.assign(mermaidMockImpl, {
    render: (..._args: unknown[]) => Promise.resolve({ svg: '<svg>mock</svg>' }),
  });
});
