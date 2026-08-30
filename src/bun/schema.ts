import type {
  Bookmark,
  CompletedModule,
  Highlight,
  LastSession,
  ModuleSession,
  Note,
  QuizSchedule,
  StorageData,
  StudySession,
} from './types';

const SESSION_TYPES = new Set(['reading', 'quiz', 'review', 'ai_skill']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === 'string';
}

function isHighlight(v: unknown): v is Highlight {
  if (!isRecord(v)) return false;
  return (
    isString(v.id) &&
    isString(v.courseID) &&
    isString(v.moduleID) &&
    isString(v.selectedText) &&
    isNumber(v.startOffset) &&
    isNumber(v.endOffset) &&
    isString(v.color) &&
    isString(v.createdAt) &&
    (v.sectionID === undefined || isStringOrNull(v.sectionID))
  );
}

function isNote(v: unknown): v is Note {
  if (!isRecord(v)) return false;
  return (
    isString(v.id) &&
    isString(v.courseID) &&
    isString(v.moduleID) &&
    isStringOrNull(v.highlightID) &&
    isStringOrNull(v.sectionID) &&
    isString(v.content) &&
    isString(v.createdAt) &&
    isString(v.updatedAt)
  );
}

const BOOKMARK_KINDS = new Set(['module', 'section', 'highlight']);

function isBookmark(v: unknown): v is Bookmark {
  if (!isRecord(v)) return false;
  return (
    isString(v.id) &&
    isString(v.courseID) &&
    isString(v.moduleID) &&
    isStringOrNull(v.sectionID) &&
    isString(v.title) &&
    (v.scrollPosition === undefined || isNumber(v.scrollPosition)) &&
    (v.kind === undefined || (isString(v.kind) && BOOKMARK_KINDS.has(v.kind))) &&
    (v.snippet === undefined || isString(v.snippet)) &&
    isString(v.createdAt)
  );
}

function isCompletedModule(v: unknown): v is CompletedModule {
  if (!isRecord(v)) return false;
  return isString(v.courseID) && isString(v.moduleID) && isString(v.completedAt);
}

function isStudySession(v: unknown): v is StudySession {
  if (!isRecord(v)) return false;
  if (
    !isString(v.date) ||
    !isString(v.courseID) ||
    !isString(v.moduleID) ||
    !isNumber(v.durationMinutes) ||
    !isString(v.type) ||
    !SESSION_TYPES.has(v.type)
  ) {
    return false;
  }
  if (v.score !== undefined && !isNumber(v.score)) return false;
  if (v.total !== undefined && !isNumber(v.total)) return false;
  return true;
}

function isModuleSession(v: unknown): v is ModuleSession {
  if (!isRecord(v)) return false;
  return (
    isString(v.courseId) &&
    isString(v.moduleId) &&
    isString(v.sectionId) &&
    isNumber(v.scrollPosition) &&
    isString(v.updatedAt)
  );
}

function isQuizSchedule(v: unknown): v is QuizSchedule {
  if (!isRecord(v)) return false;
  return isNumber(v.intervalDays) && isString(v.nextDue);
}

function isLastSession(v: unknown): v is LastSession {
  if (!isRecord(v)) return false;
  const course = v.course;
  const module = v.module;
  if (
    !isRecord(course) ||
    !isString(course.id) ||
    !isString(course.course) ||
    !isString(course.displayName)
  ) {
    return false;
  }
  if (!isRecord(module) || !isString(module.id) || !isString(module.name)) return false;
  return isString(v.sectionId) && isNumber(v.scrollPosition) && isString(v.updatedAt);
}

export interface SanitizedStorage {
  data: StorageData;
  dropped: number;
}

const KNOWN_KEYS = new Set([
  'highlights',
  'notes',
  'bookmarks',
  'completedModules',
  'studySessions',
  'remoteRepoURL',
  'lastSyncedCommit',
  'lastSyncTime',
  'lastSession',
  'moduleSessions',
  'quizSchedule',
  'version',
]);

export function sanitizeStorageData(raw: unknown): SanitizedStorage {
  const src = isRecord(raw) ? raw : {};
  let dropped = 0;

  const arrayOf = <T>(key: string, guard: (v: unknown) => v is T): T[] => {
    const value = src[key];
    if (value === undefined) return [];
    if (!Array.isArray(value)) {
      dropped += 1;
      return [];
    }
    const out: T[] = [];
    for (const item of value) {
      if (guard(item)) out.push(item);
      else dropped += 1;
    }
    return out;
  };

  const recordOf = <T>(
    key: string,
    guard: (v: unknown) => v is T,
  ): Record<string, T> | undefined => {
    const value = src[key];
    if (value === undefined) return undefined;
    if (!isRecord(value)) {
      dropped += 1;
      return undefined;
    }
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(value)) {
      if (guard(v)) out[k] = v;
      else dropped += 1;
    }
    return out;
  };

  const optionalString = (key: string): string | undefined => {
    const value = src[key];
    if (value === undefined) return undefined;
    if (!isString(value)) {
      dropped += 1;
      return undefined;
    }
    return value;
  };

  const optionalStringOrNull = (key: string): string | null | undefined => {
    const value = src[key];
    if (value === undefined) return undefined;
    if (!isStringOrNull(value)) {
      dropped += 1;
      return undefined;
    }
    return value;
  };

  const optionalLastSession = (): LastSession | null | undefined => {
    const value = src.lastSession;
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (!isLastSession(value)) {
      dropped += 1;
      return undefined;
    }
    return value;
  };

  const out: Record<string, unknown> = {};

  out.highlights = arrayOf('highlights', isHighlight);
  out.notes = arrayOf('notes', isNote);
  out.bookmarks = arrayOf('bookmarks', isBookmark);
  out.completedModules = arrayOf('completedModules', isCompletedModule);
  out.studySessions = arrayOf('studySessions', isStudySession);

  const remoteRepoURL = optionalString('remoteRepoURL');
  if (remoteRepoURL !== undefined) out.remoteRepoURL = remoteRepoURL;
  const lastSyncedCommit = optionalStringOrNull('lastSyncedCommit');
  if (lastSyncedCommit !== undefined) out.lastSyncedCommit = lastSyncedCommit;
  const lastSyncTime = optionalStringOrNull('lastSyncTime');
  if (lastSyncTime !== undefined) out.lastSyncTime = lastSyncTime;
  const lastSession = optionalLastSession();
  if (lastSession !== undefined) out.lastSession = lastSession;
  const moduleSessions = recordOf('moduleSessions', isModuleSession);
  if (moduleSessions !== undefined) out.moduleSessions = moduleSessions;
  const quizSchedule = recordOf('quizSchedule', isQuizSchedule);
  if (quizSchedule !== undefined) out.quizSchedule = quizSchedule;

  const version = src.version;
  if (version !== undefined) {
    if (isNumber(version)) out.version = version;
    else dropped += 1;
  }

  for (const key of Object.keys(src)) {
    if (!KNOWN_KEYS.has(key)) out[key] = src[key];
  }

  return { data: out as unknown as StorageData, dropped };
}
