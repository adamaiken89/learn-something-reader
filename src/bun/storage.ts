import { logger } from './logger';
import type {
  Highlight,
  Note,
  Bookmark,
  CompletedModule,
  StudySession,
  UserCard,
  LastSession,
} from './types';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.env.HOME || '', '.coursereader');
const DB_FILE = join(DATA_DIR, 'data.json');

interface StorageData {
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  completedModules: CompletedModule[];
  studySessions: StudySession[];
  userCards: UserCard[];
  geminiAPIKey?: string;
  remoteRepoURL?: string;
  lastSyncedCommit?: string | null;
  lastSyncTime?: string | null;
  lastSession?: LastSession | null;
}

function load(): StorageData {
  if (!existsSync(DB_FILE))
    return {
      highlights: [],
      notes: [],
      bookmarks: [],
      completedModules: [],
      studySessions: [],
      userCards: [],
    };
  try {
    const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
    if (!data.completedModules) data.completedModules = [];
    if (!data.studySessions) data.studySessions = [];
    if (!data.userCards) data.userCards = [];
    return data;
  } catch (e) {
    logger.warn(
      { err: (e as Error).message, file: DB_FILE },
      'Failed to load data.json, using defaults',
    );
    return {
      highlights: [],
      notes: [],
      bookmarks: [],
      completedModules: [],
      studySessions: [],
      userCards: [],
    };
  }
}

function save(data: StorageData): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function getHighlightsForModule(courseID: string, moduleID: string): Highlight[] {
  const data = load();
  return data.highlights
    .filter((h) => h.courseID === courseID && h.moduleID === moduleID)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addHighlight(
  courseID: string,
  moduleID: string,
  selectedText: string,
  startOffset: number,
  endOffset: number,
  color: string = 'yellow',
): Highlight {
  const data = load();
  const existing = data.highlights.find(
    (h) =>
      h.courseID === courseID &&
      h.moduleID === moduleID &&
      h.selectedText === selectedText &&
      h.startOffset === startOffset &&
      h.endOffset === endOffset,
  );
  if (existing) {
    existing.color = color;
    save(data);
    return existing;
  }
  const highlight: Highlight = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    selectedText,
    startOffset,
    endOffset,
    color,
    createdAt: new Date().toISOString(),
  };
  data.highlights.push(highlight);
  save(data);
  return highlight;
}

export function deleteHighlight(id: string): void {
  const data = load();
  data.highlights = data.highlights.filter((h) => h.id !== id);
  save(data);
}

export function addNote(
  courseID: string,
  moduleID: string,
  content: string,
  highlightID?: string,
  sectionID?: string,
): Note {
  const data = load();
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    highlightID: highlightID || null,
    sectionID: sectionID || null,
    content,
    createdAt: now,
    updatedAt: now,
  };
  data.notes.push(note);
  save(data);
  return note;
}

export function getNotesForModule(courseID: string, moduleID: string): Note[] {
  const data = load();
  return data.notes
    .filter((n) => n.courseID === courseID && n.moduleID === moduleID)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function updateNote(id: string, content: string): void {
  const data = load();
  const note = data.notes.find((n) => n.id === id);
  if (note) {
    note.content = content;
    note.updatedAt = new Date().toISOString();
    save(data);
  }
}

export function deleteNote(id: string): void {
  const data = load();
  data.notes = data.notes.filter((n) => n.id !== id);
  save(data);
}

export function addAnnotation(data: {
  courseID: string;
  moduleID: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  color: string;
  noteContent: string;
}): { highlight: Highlight; note: Note } {
  const highlight = addHighlight(
    data.courseID,
    data.moduleID,
    data.selectedText,
    data.startOffset,
    data.endOffset,
    data.color,
  );
  const note = addNote(data.courseID, data.moduleID, data.noteContent, highlight.id, undefined);
  return { highlight, note };
}

export function addBookmark(
  courseID: string,
  moduleID: string,
  title: string,
  sectionID?: string,
  scrollPosition: number = 0,
): Bookmark {
  const data = load();
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    courseID,
    moduleID,
    sectionID: sectionID || null,
    title,
    scrollPosition,
    createdAt: new Date().toISOString(),
  };
  data.bookmarks.push(bookmark);
  save(data);
  return bookmark;
}

export function getAllBookmarks(): Bookmark[] {
  const data = load();
  return data.bookmarks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getBookmarksForCourse(courseID: string): Bookmark[] {
  const data = load();
  return data.bookmarks
    .filter((b) => b.courseID === courseID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBookmarksForModule(courseID: string, moduleID: string): Bookmark[] {
  const data = load();
  return data.bookmarks
    .filter((b) => b.courseID === courseID && b.moduleID === moduleID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteBookmark(id: string): void {
  const data = load();
  data.bookmarks = data.bookmarks.filter((b) => b.id !== id);
  save(data);
}

export function getGeminiKey(): string | null {
  const data = load();
  return data.geminiAPIKey || null;
}

export function setGeminiKey(key: string): void {
  const data = load();
  data.geminiAPIKey = key;
  save(data);
}

export function isBookmarked(courseID: string, moduleID: string): boolean {
  const data = load();
  return data.bookmarks.some((b) => b.courseID === courseID && b.moduleID === moduleID);
}

export function isModuleCompleted(courseID: string, moduleID: string): boolean {
  const data = load();
  return data.completedModules.some((m) => m.courseID === courseID && m.moduleID === moduleID);
}

export function toggleModuleCompleted(courseID: string, moduleID: string): boolean {
  const data = load();
  const idx = data.completedModules.findIndex(
    (m) => m.courseID === courseID && m.moduleID === moduleID,
  );
  if (idx >= 0) {
    data.completedModules.splice(idx, 1);
    save(data);
    return false;
  }
  data.completedModules.push({ courseID, moduleID, completedAt: new Date().toISOString() });
  save(data);
  return true;
}

export function getCompletedModuleIDs(courseID: string): string[] {
  const data = load();
  return data.completedModules.filter((m) => m.courseID === courseID).map((m) => m.moduleID);
}

export function getCompletedModuleCount(courseID: string): number {
  const data = load();
  return data.completedModules.filter((m) => m.courseID === courseID).length;
}

export function addStudySession(
  session: Omit<StudySession, 'date'> & { date?: string },
): StudySession {
  const data = load();
  const full: StudySession = {
    ...session,
    date: session.date || new Date().toISOString().split('T')[0],
  };
  data.studySessions.push(full);
  save(data);
  return full;
}

export function getStudySessions(courseID: string, days?: number): StudySession[] {
  const data = load();
  let sessions = data.studySessions.filter((s) => s.courseID === courseID);
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    sessions = sessions.filter((s) => new Date(s.date) >= cutoff);
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export function getGlobalStudySessions(days?: number): StudySession[] {
  const data = load();
  let sessions = [...data.studySessions];
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    sessions = sessions.filter((s) => new Date(s.date) >= cutoff);
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export function getDailyStreak(): number {
  const data = load();
  const dates = [...new Set(data.studySessions.map((s) => s.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday()) return 0;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── FSRS-5 helpers (shared with srs.ts) ─────────────────────────

const _W = [
  0.212, 1.2931, 2.3065, 8.2956, 8.2956, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
  0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];
const _DECAY = -_W[20];
const _FACTOR = 0.9 ** (1 / _DECAY) - 1;

function _retrievability(elapsed: number, s: number): number {
  return (1 + (_FACTOR * elapsed) / s) ** _DECAY;
}

function _clamp(v: number, lo = 0.001, hi = 36500): number {
  return Math.max(lo, Math.min(hi, v));
}

function _initStability(r: number): number {
  return _clamp(_W[r - 1]);
}

function _initDifficulty(r: number): number {
  return Math.max(1, Math.min(10, _W[4] - Math.exp(_W[5] * (r - 1)) + 1));
}

function _recallStab(s: number, d: number, ret: number, r: number): number {
  const hp = r === 2 ? _W[15] : 1;
  const eb = r === 4 ? _W[16] : 1;
  const delta =
    Math.exp(_W[8]) * (11 - d) * s ** -_W[9] * (Math.exp((1 - ret) * _W[10]) - 1) * hp * eb;
  return _clamp(s * (1 + delta));
}

function _forgetStab(s: number, d: number, ret: number): number {
  const lt = _W[11] * d ** -_W[12] * ((s + 1) ** _W[13] - 1) * Math.exp((1 - ret) * _W[14]);
  const st = s / Math.exp(_W[17] * _W[18]);
  return _clamp(Math.min(lt, st));
}

function _nextDiff(d: number, r: number): number {
  const arg1 = _W[4] - Math.exp(_W[5] * 3) + 1;
  const dd = -_W[6] * (r - 3);
  const arg2 = d + ((10 - d) * dd) / 9;
  const nd = _W[7] * arg1 + (1 - _W[7]) * arg2;
  return Math.max(1, Math.min(10, nd));
}

function _shortTermStab(s: number, r: number): number {
  let inc = Math.exp(_W[17] * (r - 3 + _W[18])) * s ** -_W[19];
  if (r >= 3) inc = Math.max(inc, 1.0);
  return _clamp(s * inc);
}

function _nextInt(s: number): number {
  return Math.max(1, Math.min(36500, Math.round((s / _FACTOR) * (0.9 ** (1 / _DECAY) - 1))));
}

function _migrate(card: UserCard): void {
  if (card.stability !== undefined) return;
  card.stability = Math.max(1.0, card.interval);
  card.difficulty = Math.max(1, Math.min(10, 5 + (2.5 - card.easeFactor) * 2));
  card.lapses = 0;
  card.state = card.repetitions > 0 ? 'Review' : 'New';
}

// ── UserCard CRUD ────────────────────────────────

export function addUserCard(
  courseId: string,
  moduleId: string,
  front: string,
  back: string,
): UserCard {
  const data = load();
  const card: UserCard = {
    id: crypto.randomUUID(),
    courseId,
    moduleId,
    front,
    back,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewed: null,
    isStarred: false,
    createdAt: new Date().toISOString(),
    stability: undefined,
    difficulty: undefined,
    lapses: 0,
    state: 'New',
  };
  data.userCards.push(card);
  save(data);
  return card;
}

export function getUserCards(courseId?: string, moduleId?: string): UserCard[] {
  const data = load();
  let cards = data.userCards;
  if (courseId) cards = cards.filter((c) => c.courseId === courseId);
  if (moduleId !== undefined) cards = cards.filter((c) => c.moduleId === moduleId);
  return cards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getAllUserCards(): UserCard[] {
  const data = load();
  return [...data.userCards].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function getUserCardById(id: string): UserCard | undefined {
  const data = load();
  return data.userCards.find((c) => c.id === id);
}

export function deleteUserCard(id: string): void {
  const data = load();
  data.userCards = data.userCards.filter((c) => c.id !== id);
  save(data);
}

export function updateUserCard(
  id: string,
  updates: { front?: string; back?: string },
): UserCard | null {
  const data = load();
  const card = data.userCards.find((c) => c.id === id);
  if (!card) return null;
  if (updates.front !== undefined) card.front = updates.front;
  if (updates.back !== undefined) card.back = updates.back;
  save(data);
  return card;
}

export function reviewUserCard(id: string, correct: boolean, now?: Date): UserCard | null {
  const data = load();
  const card = data.userCards.find((c) => c.id === id);
  if (!card) return null;

  _migrate(card);

  const nowDate = now || new Date();
  const r = correct ? 3 : 1;
  const state = card.state || 'New';

  let elapsedDays = 0;
  if (card.lastReviewed) {
    const lr = new Date(card.lastReviewed);
    elapsedDays = Math.max(
      0,
      Math.floor((nowDate.getTime() - lr.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  if (state === 'New') {
    card.stability = _initStability(r);
    card.difficulty = _initDifficulty(r);
    card.lapses = 0;
    card.state = 'Review';
  } else if (elapsedDays < 1) {
    if (r >= 3) {
      card.stability = _shortTermStab(card.stability!, r);
    } else {
      card.stability = _forgetStab(card.stability!, card.difficulty!, 1.0);
    }
    card.difficulty = _nextDiff(card.difficulty!, r);
    if (r < 3) {
      card.lapses = (card.lapses || 0) + 1;
      card.state = 'Relearning';
    }
  } else if (r >= 3) {
    const ret = _retrievability(elapsedDays, card.stability!);
    card.stability = _recallStab(card.stability!, card.difficulty!, ret, r);
    card.difficulty = _nextDiff(card.difficulty!, r);
  } else {
    const ret = _retrievability(elapsedDays, card.stability!);
    card.lapses = (card.lapses || 0) + 1;
    card.stability = _forgetStab(card.stability!, card.difficulty!, ret);
    card.difficulty = _nextDiff(card.difficulty!, r);
    card.state = 'Relearning';
  }

  const interval = _nextInt(card.stability!);
  card.interval = interval;
  card.easeFactor =
    Math.round(Math.max(1.3, Math.min(5.0, 2.5 - (card.difficulty! - 5) * 0.15)) * 100) / 100;
  card.repetitions = r >= 3 ? (card.repetitions || 0) + 1 : 0;

  const nextDate = new Date(nowDate);
  nextDate.setDate(nextDate.getDate() + interval);
  card.nextReviewDate = nextDate.toISOString();
  card.lastReviewed = nowDate.toISOString();

  save(data);
  return card;
}

export function toggleUserCardStar(id: string): UserCard | null {
  const data = load();
  const card = data.userCards.find((c) => c.id === id);
  if (!card) return null;
  card.isStarred = !card.isStarred;
  save(data);
  return card;
}

// --- Sync Config ---

export function getSyncConfig(): {
  remoteRepoURL: string;
  lastSyncedCommit: string | null;
  lastSyncTime: string | null;
} {
  const data = load();
  return {
    remoteRepoURL: data.remoteRepoURL || '',
    lastSyncedCommit: data.lastSyncedCommit || null,
    lastSyncTime: data.lastSyncTime || null,
  };
}

export function clearAllData(): void {
  save({
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
    userCards: [],
  });
}

export function getLastSession(): LastSession | null {
  const data = load();
  return data.lastSession ?? null;
}

export function setLastSession(session: LastSession): void {
  const data = load();
  data.lastSession = session;
  save(data);
}

export function clearLastSession(): void {
  const data = load();
  data.lastSession = null;
  save(data);
}

export function saveSyncConfig(config: {
  remoteRepoURL?: string;
  lastSyncedCommit?: string | null;
  lastSyncTime?: string | null;
}): void {
  const data = load();
  if (config.remoteRepoURL !== undefined) data.remoteRepoURL = config.remoteRepoURL;
  if (config.lastSyncedCommit !== undefined) data.lastSyncedCommit = config.lastSyncedCommit;
  if (config.lastSyncTime !== undefined) data.lastSyncTime = config.lastSyncTime;
  save(data);
}
