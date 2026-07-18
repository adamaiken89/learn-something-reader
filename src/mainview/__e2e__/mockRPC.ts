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
  getDueCardsCount: () => 0,
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
  getLastQuizSession: () => null,
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
  getModuleSession: () => null,
  setModuleSession: () => ({ ok: true as const }),
  getCourseModuleSessions: () => [],

  // Quiz availability checks
  hasClozeQuiz: () => false,
  hasCumulativeQuiz: () => false,
  setWindowTitle: () => undefined,
  openExternal: () => ({ ok: true }),

  // Cloze quiz
  loadClozeQuiz: (params) => {
    const { courseId, moduleId } = p<{ courseId: string; moduleId: string }>(params);
    return mockData.getQuiz(courseId, moduleId).filter((q) => q.type === 'cloze');
  },

  // Cumulative quiz
  loadCumulativeQuiz: () => ({
    questions: mockData.getQuiz('test', '1').slice(0, 3),
  }),
  quizIndex: () => ({
    modules: {
      '01-getting-started': { mcq: true, cloze: false },
      '02-variables': { mcq: true, cloze: true },
      '03-control-flow': { mcq: true, cloze: false },
    },
    cumulativeQuizzes: [{ id: 'cumulative_quiz.yaml', milestone: 10 }],
  }),

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
