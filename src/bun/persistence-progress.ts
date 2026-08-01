import type { StudySession, LastSession, ModuleSession } from './types';
import { load, save } from './persistence';

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

export function getModuleCompletedAt(courseID: string, moduleID: string): string | null {
  const data = load();
  const m = data.completedModules.find((c) => c.courseID === courseID && c.moduleID === moduleID);
  return m?.completedAt ?? null;
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

export function getLastQuizSession(courseID: string, moduleID: string): StudySession | null {
  const data = load();
  const sessions = data.studySessions.filter(
    (s) => s.courseID === courseID && s.moduleID === moduleID && s.type === 'quiz',
  );
  if (sessions.length === 0) return null;
  sessions.sort((a, b) => b.date.localeCompare(a.date));
  return sessions[0];
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

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
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

export function getModuleSession(courseId: string, moduleId: string): ModuleSession | null {
  const data = load();
  const key = `${courseId}:${moduleId}`;
  return data.moduleSessions?.[key] ?? null;
}

export function setModuleSession(session: ModuleSession): void {
  const data = load();
  const key = `${session.courseId}:${session.moduleId}`;
  if (!data.moduleSessions) data.moduleSessions = {};
  data.moduleSessions[key] = session;
  save(data);
}

export function getCourseModuleSessions(courseId: string): ModuleSession[] {
  const data = load();
  if (!data.moduleSessions) return [];
  return Object.entries(data.moduleSessions)
    .filter(([k]) => k.startsWith(`${courseId}:`))
    .map(([, v]) => v)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
