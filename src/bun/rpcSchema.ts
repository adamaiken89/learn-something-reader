import type { RPCSchema } from 'electrobun/main';
import type { MetaField } from './lessonMarkdown';
import type { CourseQuizStatus, CourseStats, GlobalStats } from './stats';
import type { SearchResult } from './search';
import type {
  Bookmark,
  Course,
  CumulativeQuiz,
  Highlight,
  LastSession,
  ModuleMeta,
  ModuleSession,
  Note,
  QuizIndex,
  QuizQuestion,
  Section,
  SRSCard,
  SRSDeck,
  StudySession,
} from './types';

interface LessonResponse {
  content: string;
  h1: string;
  meta: MetaField[];
  sections: Section[];
  bodyContent: string;
}

interface SyncStatus {
  lastSyncTime: string | null;
  lastSyncedCommit: string | null;
  isSyncing: boolean;
  remoteRepoURL: string;
}

interface SyncResult {
  success: boolean;
  commitHash: string;
  message: string;
  unchanged?: boolean;
}

type CourseRequests = {
  coursesList: { params: void; response: Course[] };
  modulesList: { params: { courseId: string }; response: ModuleMeta[] };
  loadLesson: { params: { courseId: string; moduleId: string }; response: LessonResponse };
  loadQuiz: { params: { courseId: string; moduleId: string }; response: QuizQuestion[] };
  loadCumulativeQuiz: {
    params: { courseId: string; id?: string };
    response: CumulativeQuiz;
  };
  hasCumulativeQuiz: { params: { courseId: string }; response: boolean };
  quizIndex: { params: { courseId: string }; response: QuizIndex };
  quizStatus: { params: { courseId: string }; response: CourseQuizStatus };
  getSections: { params: { courseId: string; moduleId: string }; response: Section[] };
  search: { params: { query: string; courseID?: string }; response: SearchResult[] };
  quizStart: { params: { courseId: string; moduleId: string }; response: QuizQuestion[] };
};

type SRSRequests = {
  getSRSDeck: { params: { courseId: string }; response: SRSDeck };
  filterSRSCards: { params: { courseId: string; filter: string }; response: SRSCard[] };
  getDueCardsCount: { params: { courseId: string }; response: number };
  toggleSRSStar: { params: { courseId: string; cardId: string }; response: SRSDeck };
  reviewSRSCard: {
    params: { courseId: string; cardId: string; correct: boolean; deck: SRSDeck };
    response: SRSCard;
  };
  createSRSCard: {
    params: { courseId: string; question: QuizQuestion; moduleId: string };
    response: SRSCard;
  };
};

type AnnotationRequests = {
  getHighlights: { params: { courseID: string; moduleID: string }; response: Highlight[] };
  addHighlight: {
    params: {
      courseID: string;
      moduleID: string;
      selectedText: string;
      startOffset: number;
      endOffset: number;
      color?: string;
    };
    response: Highlight;
  };
  deleteHighlight: { params: { id: string }; response: { ok: true } };
  addAnnotation: {
    params: {
      courseID: string;
      moduleID: string;
      selectedText: string;
      startOffset: number;
      endOffset: number;
      color: string;
      noteContent: string;
    };
    response: { highlight: Highlight; note: Note };
  };
  getNotes: { params: { courseID: string; moduleID: string }; response: Note[] };
  addNote: {
    params: {
      courseID: string;
      moduleID: string;
      content: string;
      highlightID?: string;
      sectionID?: string;
    };
    response: Note;
  };
  updateNote: { params: { id: string; content: string }; response: { ok: true } };
  deleteNote: { params: { id: string }; response: { ok: true } };
  getAllBookmarks: { params: void; response: Bookmark[] };
  getCourseBookmarks: { params: { courseID: string }; response: Bookmark[] };
  getModuleBookmarks: { params: { courseID: string; moduleID: string }; response: Bookmark[] };
  addBookmark: {
    params: {
      courseID: string;
      moduleID: string;
      title: string;
      sectionID?: string;
      scrollPosition?: number;
    };
    response: Bookmark;
  };
  deleteBookmark: { params: { id: string }; response: { ok: true } };
  checkBookmark: { params: { courseID: string; moduleID: string }; response: boolean };
};

type ProgressRequests = {
  isModuleCompleted: { params: { courseID: string; moduleID: string }; response: boolean };
  toggleModuleCompleted: { params: { courseID: string; moduleID: string }; response: boolean };
  getCompletedModuleIDs: { params: { courseID: string }; response: string[] };
  getCompletedModuleCount: { params: { courseID: string }; response: number };
  logSession: {
    params: {
      courseID: string;
      moduleID: string;
      durationMinutes: number;
      type: 'reading' | 'quiz' | 'review';
      score?: number;
      total?: number;
    };
    response: { ok: true };
  };
  getCourseStats: { params: { courseId: string }; response: CourseStats };
  getGlobalStats: { params: void; response: GlobalStats };
  getLastQuizSession: {
    params: { courseID: string; moduleID: string };
    response: StudySession | null;
  };
};

type SyncRequests = {
  getSyncStatus: { params: void; response: SyncStatus };
  syncStart: { params: { force?: boolean }; response: SyncResult };
  syncSetURL: { params: { remoteRepoURL: string }; response: { ok: true } };
};

export type AppRequests = CourseRequests &
  SRSRequests &
  AnnotationRequests &
  ProgressRequests &
  SyncRequests & {
    clearAllData: { params: void; response: { ok: true } };
    clearLogs: { params: void; response: { ok: true } };
    setWindowTitle: { params: { title: string }; response: { ok: true } };
    openExternal: { params: { url: string }; response: { ok: boolean } };
    getLastSession: { params: void; response: LastSession | null };
    setLastSession: { params: LastSession; response: { ok: true } };
    clearLastSession: { params: void; response: { ok: true } };
    getModuleSession: {
      params: { courseId: string; moduleId: string };
      response: ModuleSession | null;
    };
    setModuleSession: { params: ModuleSession; response: { ok: true } };
    getCourseModuleSessions: { params: { courseId: string }; response: ModuleSession[] };
  };

export type AppSchema = {
  bun: RPCSchema<{ requests: AppRequests }>;
  webview: RPCSchema;
};
