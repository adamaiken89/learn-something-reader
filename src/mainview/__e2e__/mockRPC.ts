import * as mockData from './mockData';

type MockHandler = (params: unknown) => unknown;

function p<T>(params: unknown): T {
  return params as T;
}

const HANDLERS: Record<string, MockHandler> = {
  // Courses
  coursesList: () => mockData.courses,
  modulesList: (params) => mockData.getModules(p<{ courseId: string }>(params).courseId),
  loadLesson: (params) => {
    const { courseId, moduleId } = p<{ courseId: string; moduleId: string }>(params);
    return mockData.getLesson(courseId, moduleId);
  },
  loadQuiz: (params) => {
    const { courseId, moduleId } = p<{ courseId: string; moduleId: string }>(params);
    return mockData.getQuiz(courseId, moduleId);
  },
  getSections: (params) => {
    const { courseId, moduleId } = p<{ courseId: string; moduleId: string }>(params);
    return mockData.getSections(courseId, moduleId);
  },
  search: () => mockData.getSearchResults(),
  quizStart: (params) => {
    const { courseId, moduleId } = p<{ courseId: string; moduleId: string }>(params);
    return mockData.getQuiz(courseId, moduleId);
  },

  // SRS
  getSRSDeck: () => ({ cards: {} }),
  filterSRSCards: () => [],
  toggleSRSStar: () => ({ cards: {} }),
  reviewSRSCard: () => null,
  createSRSCard: () => null,

  // Annotations
  getHighlights: () => [],
  addHighlight: () => mockData.getMockHighlight(),
  deleteHighlight: () => ({ ok: true as const }),
  addAnnotation: () => ({
    highlight: mockData.getMockHighlight(),
    note: mockData.getMockNote(),
  }),
  getNotes: () => [],
  addNote: () => mockData.getMockNote(),
  updateNote: () => ({ ok: true as const }),
  deleteNote: () => ({ ok: true as const }),
  getAllBookmarks: () => [],
  getCourseBookmarks: () => [],
  getModuleBookmarks: () => [],
  addBookmark: () => mockData.getMockBookmark(),
  deleteBookmark: () => ({ ok: true as const }),
  checkBookmark: () => false,

  // Progress
  isModuleCompleted: () => false,
  toggleModuleCompleted: () => true,
  getCompletedModuleIDs: () => [],
  getCompletedModuleCount: () => 0,
  logSession: () => ({ ok: true as const }),
  getCourseStats: (params) => mockData.getCourseStats(p<{ courseId: string }>(params).courseId),
  getGlobalStats: () => mockData.getGlobalStats(),
  geminiHasKey: () => false,
  geminiSetKey: () => ({ ok: true as const }),
  geminiAsk: () => 'This is a mock response from the E2E test suite.',

  // Sync
  getSyncStatus: () => ({
    lastSyncTime: null,
    lastSyncedCommit: null,
    isSyncing: false,
    remoteRepoURL: '',
  }),
  syncStart: () => ({ success: true, commitHash: 'abc123', message: 'Mock sync' }),
  syncSetURL: () => ({ ok: true as const }),

  // User Cards
  getUserCards: () => [],
  addUserCard: () => mockData.getMockUserCard(),
  deleteUserCard: () => ({ ok: true as const }),
  reviewUserCard: () => mockData.getMockUserCard(),
  toggleUserCardStar: () => mockData.getMockUserCard(),

  // Sessions
  getLastSession: () => null,
  setLastSession: () => ({ ok: true as const }),
  clearLastSession: () => ({ ok: true as const }),

  // Data
  clearAllData: () => ({ ok: true as const }),
  clearLogs: () => ({ ok: true as const }),
};

export function createMockRPC() {
  return {
    request: new Proxy({} as Record<string, (p: unknown) => Promise<unknown>>, {
      get(_, method: string) {
        return (params: unknown) => {
          const handler = HANDLERS[method];
          if (!handler) {
            return Promise.reject(new Error('Unknown RPC method: ' + method));
          }
          try {
            return Promise.resolve(handler(params));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      },
    }),
  };
}
