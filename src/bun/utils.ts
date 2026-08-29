import { existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

export function normalizeModuleId(id: string | number): string {
  if (typeof id === 'number') return String(id).padStart(2, '0');
  return id;
}

const COURSES_DIR = join(homedir(), '.coursereader', 'subjects');

export function findSubjectsDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [resolve(moduleDir, 'subjects'), resolve(moduleDir, '..', 'subjects')]) {
    if (existsSync(candidate)) return candidate;
  }
  mkdirSync(COURSES_DIR, { recursive: true });
  return COURSES_DIR;
}
