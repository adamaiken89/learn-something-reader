import { BrowserView, BrowserWindow, Updater, Utils } from 'electrobun/bun';
import type { AppSchema } from './rpcSchema';
import * as CourseLoader from './courseLoader';
import * as Annotations from './persistence-annotations';
import { clearAllData } from './persistence';
import * as Progress from './persistence-progress';
import { processLessonMarkdown } from './lessonMarkdown';
import {
  getDueCardsForCourse,
  getStarredCardsForCourse,
  getCardsForCourse,
  toggleStar,
  createSRSCard,
  performReview,
} from './srs';
import * as Search from './search';
import * as Stats from './stats';
import * as Sync from './sync';
import { clearLogFiles, logger } from './logger';

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const rpc = BrowserView.defineRPC<AppSchema>({
  maxRequestTime: 30000,
  handlers: {
    requests: {
      coursesList: () => CourseLoader.loadCourses(),

      modulesList: ({ courseId }) => {
        const courses = CourseLoader.loadCourses();
        const course = courses.find((s) => s.id === courseId);
        return course?.modules || [];
      },

      loadLesson: ({ courseId, moduleId }) => {
        const content = CourseLoader.loadLesson(courseId, moduleId);
        const processed = processLessonMarkdown(content);
        return { content, ...processed };
      },

      loadQuiz: ({ courseId, moduleId }) => CourseLoader.loadQuiz(courseId, moduleId),

      loadClozeQuiz: ({ courseId, moduleId }) => CourseLoader.loadClozeQuiz(courseId, moduleId),

      hasClozeQuiz: ({ courseId, moduleId }) => CourseLoader.hasClozeQuiz(courseId, moduleId),

      loadCumulativeQuiz: ({ courseId, id }) => CourseLoader.loadCumulativeQuiz(courseId, id),

      hasCumulativeQuiz: ({ courseId }) => CourseLoader.hasCumulativeQuiz(courseId),

      quizIndex: ({ courseId }) => CourseLoader.getQuizIndex(courseId),

      getSections: ({ courseId, moduleId }) => {
        const content = CourseLoader.loadLesson(courseId, moduleId);
        return processLessonMarkdown(content).sections;
      },

      search: ({ query, courseID }) => Search.searchAll(query, courseID),

      getSRSDeck: ({ courseId }) => CourseLoader.loadSRSDeck(courseId),

      filterSRSCards: ({ courseId, filter }) => {
        const deck = CourseLoader.loadSRSDeck(courseId);
        switch (filter) {
          case 'due':
            return getDueCardsForCourse(deck, courseId);
          case 'starred':
            return getStarredCardsForCourse(deck, courseId);
          default:
            return getCardsForCourse(deck, courseId);
        }
      },

      getDueCardsCount: ({ courseId }) => {
        const deck = CourseLoader.loadSRSDeck(courseId);
        return getDueCardsForCourse(deck, courseId).length;
      },

      toggleSRSStar: ({ courseId, cardId }) => {
        const deck = CourseLoader.loadSRSDeck(courseId);
        const updated = toggleStar(deck, cardId);
        CourseLoader.saveSRSDeck(updated, courseId);
        return updated;
      },

      reviewSRSCard: ({ courseId, cardId, correct, deck }) => {
        const actualDeck = deck || CourseLoader.loadSRSDeck(courseId);
        const card = actualDeck.cards[cardId];
        if (!card) throw new Error('Card not found');
        const updatedCard = performReview(card, correct);
        actualDeck.cards[cardId] = updatedCard;
        CourseLoader.saveSRSDeck(actualDeck, courseId);
        return updatedCard;
      },

      createSRSCard: ({ courseId, question, moduleId }) => {
        const card = createSRSCard(question, moduleId, courseId);
        const deck = CourseLoader.loadSRSDeck(courseId);
        deck.cards[card.id] = card;
        CourseLoader.saveSRSDeck(deck, courseId);
        return card;
      },

      quizStart: ({ courseId, moduleId }) => CourseLoader.loadQuiz(courseId, moduleId),

      getHighlights: ({ courseID, moduleID }) =>
        Annotations.getHighlightsForModule(courseID, moduleID),

      addHighlight: ({ courseID, moduleID, selectedText, startOffset, endOffset, color }) =>
        Annotations.addHighlight(courseID, moduleID, selectedText, startOffset, endOffset, color),

      deleteHighlight: async ({ id }) => {
        Annotations.deleteHighlight(id);
        return { ok: true as const };
      },

      addAnnotation: (data) => Annotations.addAnnotation(data),

      getNotes: ({ courseID, moduleID }) => Annotations.getNotesForModule(courseID, moduleID),

      addNote: ({ courseID, moduleID, content, highlightID, sectionID }) =>
        Annotations.addNote(courseID, moduleID, content, highlightID, sectionID),

      updateNote: async ({ id, content }) => {
        Annotations.updateNote(id, content);
        return { ok: true as const };
      },

      deleteNote: async ({ id }) => {
        Annotations.deleteNote(id);
        return { ok: true as const };
      },

      getAllBookmarks: () => Annotations.getAllBookmarks(),

      getCourseBookmarks: ({ courseID }) => Annotations.getBookmarksForCourse(courseID),

      getModuleBookmarks: ({ courseID, moduleID }) =>
        Annotations.getBookmarksForModule(courseID, moduleID),

      addBookmark: ({ courseID, moduleID, title, sectionID, scrollPosition }) =>
        Annotations.addBookmark(courseID, moduleID, title, sectionID, scrollPosition),

      deleteBookmark: async ({ id }) => {
        Annotations.deleteBookmark(id);
        return { ok: true as const };
      },

      checkBookmark: ({ courseID, moduleID }) => Annotations.isBookmarked(courseID, moduleID),

      isModuleCompleted: ({ courseID, moduleID }) => Progress.isModuleCompleted(courseID, moduleID),

      toggleModuleCompleted: ({ courseID, moduleID }) =>
        Progress.toggleModuleCompleted(courseID, moduleID),

      getCompletedModuleIDs: ({ courseID }) => Progress.getCompletedModuleIDs(courseID),

      getCompletedModuleCount: ({ courseID }) => Progress.getCompletedModuleCount(courseID),

      clearAllData: async () => {
        clearAllData();
        return { ok: true as const };
      },

      clearLogs: async () => {
        clearLogFiles();
        return { ok: true as const };
      },

      logSession: async ({ courseID, moduleID, durationMinutes, type, score, total }) => {
        Progress.addStudySession({ courseID, moduleID, durationMinutes, type, score, total });
        return { ok: true as const };
      },

      getCourseStats: ({ courseId }) => Stats.getCourseStats(courseId),

      getGlobalStats: () => Stats.getGlobalStats(),

      getLastQuizSession: ({ courseID, moduleID }) =>
        Progress.getLastQuizSession(courseID, moduleID),

      getSyncStatus: () => {
        const config = Progress.getSyncConfig();
        return {
          lastSyncTime: config.lastSyncTime,
          lastSyncedCommit: config.lastSyncedCommit,
          isSyncing: Sync.isSyncing(),
          remoteRepoURL: config.remoteRepoURL,
        };
      },

      syncStart: async ({ force }) => Sync.syncCourses(force),

      syncSetURL: async ({ remoteRepoURL }) => {
        Progress.saveSyncConfig({ remoteRepoURL });
        return { ok: true as const };
      },

      getLastSession: () => Progress.getLastSession(),

      setLastSession: async (session) => {
        Progress.setLastSession(session);
        return { ok: true as const };
      },

      clearLastSession: async () => {
        Progress.clearLastSession();
        return { ok: true as const };
      },

      getModuleSession: ({ courseId, moduleId }) => Progress.getModuleSession(courseId, moduleId),

      setModuleSession: async (session) => {
        Progress.setModuleSession(session);
        return { ok: true as const };
      },

      getCourseModuleSessions: ({ courseId }) => Progress.getCourseModuleSessions(courseId),

      setWindowTitle: async ({ title }) => {
        mainWindow?.setTitle(title);
        return { ok: true as const };
      },

      openExternal: ({ url }) => {
        Utils.openExternal(url);
        return { ok: true as const };
      },
    },
  },
});

let mainWindow: BrowserWindow | null = null;

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === 'dev') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' });
      logger.info(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      logger.warn("Vite dev server not running. Run 'bun run dev:hmr' for HMR.");
    }
  }
  return 'views://mainview/index.html';
}

try {
  const mainViewUrl = await getMainViewUrl();
  mainWindow = new BrowserWindow({
    title: 'CourseReader',
    url: mainViewUrl,
    rpc,
    frame: {
      width: 1100,
      height: 800,
      x: 200,
      y: 200,
    },
  });
  logger.info('CourseReader started');
} catch (err) {
  logger.info('BrowserWindow not available (running standalone API server)');
}
