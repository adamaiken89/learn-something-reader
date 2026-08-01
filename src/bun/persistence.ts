import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import { sanitizeStorageData } from './schema';
import type { StorageData } from './types';

const DATA_DIR = join(process.env.HOME || '', '.coursereader');
const DB_FILE = join(DATA_DIR, 'data.json');

const EMPTY_STORAGE: StorageData = {
  highlights: [],
  notes: [],
  bookmarks: [],
  completedModules: [],
  studySessions: [],
};

let _cache: StorageData | null = null;

function _loadFresh(): StorageData {
  if (!existsSync(DB_FILE)) return { ...EMPTY_STORAGE };
  let raw = '';
  try {
    raw = readFileSync(DB_FILE, 'utf-8');
  } catch (e) {
    logger.warn(
      { err: (e as Error).message, file: DB_FILE },
      'Failed to read data.json, using defaults',
    );
    return { ...EMPTY_STORAGE };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const bakPath = backupCorruptFile(raw);
    logger.warn(
      { err: (e as Error).message, file: DB_FILE, backup: bakPath },
      'Failed to parse data.json, backed up original and using defaults',
    );
    return { ...EMPTY_STORAGE };
  }
  const { data, dropped } = sanitizeStorageData(parsed);
  if (dropped > 0) {
    logger.warn(
      { dropped, file: DB_FILE },
      'data.json contained invalid records, repaired on load',
    );
  }
  return data;
}

function backupCorruptFile(raw: string): string | null {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bakPath = join(DATA_DIR, `data.json.bak-${stamp}`);
    writeFileSync(bakPath, raw);
    return bakPath;
  } catch (e) {
    logger.warn({ err: (e as Error).message }, 'Failed to back up corrupt data.json');
    return null;
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
  save({ ...EMPTY_STORAGE });
}
