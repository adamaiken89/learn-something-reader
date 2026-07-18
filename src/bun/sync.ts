import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

import { logger } from './logger';
import { getSyncConfig, saveSyncConfig } from './persistence-progress';
import * as utilsModule from './utils';

const TMP_DIR = join(process.env.HOME || '', '.coursereader', 'tmp-sync');
const BACKUP_DIR = join(process.env.HOME || '', '.coursereader', 'subjects-bak');

let _isSyncing = false;

export function isSyncing(): boolean {
  return _isSyncing;
}

function backupSRSDirs(coursesDir: string): Map<string, string> {
  const backups = new Map<string, string>();
  if (!existsSync(coursesDir)) return backups;

  const entries = readdirSync(coursesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const deckPath = join(coursesDir, entry.name, 'srs', 'deck.json');
    if (existsSync(deckPath)) {
      backups.set(entry.name, readFileSync(deckPath, 'utf-8'));
    }
  }
  return backups;
}

function restoreSRSDirs(backups: Map<string, string>, coursesDir: string): void {
  for (const [courseId, deckJSON] of backups) {
    const srsDir = join(coursesDir, courseId, 'srs');
    mkdirSync(srsDir, { recursive: true });
    writeFileSync(join(srsDir, 'deck.json'), deckJSON);
  }
}

async function getLatestRemoteCommit(repoURL: string): Promise<string> {
  const match = repoURL.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) throw new Error('Invalid GitHub URL format');

  let [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, '');

  for (const branch of ['main', 'master']) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}/commits/${branch}`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );

    if (res.ok) {
      const data = (await res.json()) as { sha: string };
      return data.sha;
    }

    if (res.status !== 404) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
  }

  throw new Error('Could not find default branch (tried main, master)');
}

function gitClone(repoURL: string, destDir: string): void {
  execSync(`git clone --depth 1 "${repoURL}" "${destDir}"`, {
    stdio: 'pipe',
    timeout: 60000,
  });
}

function countCourseDirs(dir: string): number {
  if (!existsSync(dir)) return 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'srs')
    .length;
}

function hasValidCourse(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.some(
    (e) =>
      e.isDirectory() &&
      !e.name.startsWith('.') &&
      e.name !== 'srs' &&
      existsSync(join(dir, e.name, 'syllabus.yaml')),
  );
}

export async function syncCourses(force?: boolean): Promise<{
  success: boolean;
  commitHash: string;
  message: string;
  unchanged?: boolean;
}> {
  if (_isSyncing) return { success: false, commitHash: '', message: 'Sync already in progress' };
  _isSyncing = true;

  let coursesDir: string | null = null;

  try {
    const config = getSyncConfig();
    const repoURL = config.remoteRepoURL;

    if (!repoURL) {
      return { success: false, commitHash: '', message: 'No remote repository configured' };
    }

    const remoteSHA = await getLatestRemoteCommit(repoURL);

    coursesDir = utilsModule.findSubjectsDir();
    const needsForce = !coursesDir || !hasValidCourse(coursesDir);

    if (!force && !needsForce && remoteSHA === config.lastSyncedCommit) {
      return {
        success: true,
        commitHash: remoteSHA,
        message: 'Already up to date',
        unchanged: true,
      };
    }

    if (!coursesDir) {
      return { success: false, commitHash: '', message: 'Courses directory not found' };
    }

    const backups = backupSRSDirs(coursesDir);

    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });

    gitClone(repoURL, TMP_DIR);

    if (!hasValidCourse(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
      return {
        success: false,
        commitHash: '',
        message: 'No valid course directories found (missing syllabus.yaml)',
      };
    }

    if (existsSync(BACKUP_DIR)) rmSync(BACKUP_DIR, { recursive: true });
    if (existsSync(coursesDir)) {
      renameSync(coursesDir, BACKUP_DIR);
    }

    renameSync(TMP_DIR, coursesDir);

    restoreSRSDirs(backups, coursesDir);

    if (existsSync(BACKUP_DIR)) rmSync(BACKUP_DIR, { recursive: true, force: true });

    saveSyncConfig({
      remoteRepoURL: repoURL,
      lastSyncedCommit: remoteSHA,
      lastSyncTime: new Date().toISOString(),
    });

    const courseCount = countCourseDirs(coursesDir);

    return {
      success: true,
      commitHash: remoteSHA,
      message: `Synced ${courseCount} courses`,
    };
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Sync failed');
    if (coursesDir && existsSync(BACKUP_DIR) && !existsSync(coursesDir)) {
      renameSync(BACKUP_DIR, coursesDir);
    }
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
    if (existsSync(BACKUP_DIR)) rmSync(BACKUP_DIR, { recursive: true, force: true });
    return {
      success: false,
      commitHash: '',
      message: (err as Error).message,
    };
  } finally {
    _isSyncing = false;
  }
}
