import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import type {
  Highlight,
  Note,
  Bookmark,
  CompletedModule,
  ModuleSession,
  StudySession,
  LastSession,
} from './types';

const DATA_DIR = join(process.env.HOME || '', '.coursereader');
const DB_FILE = join(DATA_DIR, 'data.json');

export interface StorageData {
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  completedModules: CompletedModule[];
  studySessions: StudySession[];
  remoteRepoURL?: string;
  lastSyncedCommit?: string | null;
  lastSyncTime?: string | null;
  lastSession?: LastSession | null;
  moduleSessions?: Record<string, ModuleSession>;
}

let _cache: StorageData | null = null;

function _loadFresh(): StorageData {
  if (!existsSync(DB_FILE))
    return {
      highlights: [],
      notes: [],
      bookmarks: [],
      completedModules: [],
      studySessions: [],
    };
  try {
    const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
    if (!data.completedModules) data.completedModules = [];
    if (!data.studySessions) data.studySessions = [];
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
    };
  }
}

export function load(): StorageData {
  if (!_cache) _cache = _loadFresh();
  return _cache;
}

export function save(data: StorageData): void {
  _cache = data;
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function invalidateCache(): void {
  _cache = null;
}

export function clearAllData(): void {
  save({
    highlights: [],
    notes: [],
    bookmarks: [],
    completedModules: [],
    studySessions: [],
  });
}
