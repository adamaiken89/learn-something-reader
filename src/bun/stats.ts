import * as CourseLoader from './courseLoader';
import * as StorageProgress from './persistence-progress';
import * as Storage from './persistence';
import * as SRS from './srs';
import type { QuizSchedule, StudySession } from './types';

const QUIZ_DUE_DAYS = 3;
const LADDER_DAYS = [3, 7, 14, 30];
const PASS_RATIO = 0.8;

export interface QuizAttemptStatus {
  attempted: boolean;
  score: number;
  total: number;
  date: string;
  due: boolean;
  overdue: boolean;
  ready: boolean;
}

export interface ModuleQuizStatus {
  moduleId: string;
  moduleName: string;
  attempt: QuizAttemptStatus | null;
}

export interface CumulativeQuizStatus {
  id: string;
  milestone: number;
  displayLabel: string;
  attempt: QuizAttemptStatus | null;
}

export interface CourseQuizStatus {
  courseID: string;
  modules: ModuleQuizStatus[];
  cumulativeQuizzes: CumulativeQuizStatus[];
}

export interface CourseStats {
  courseID: string;
  totalModules: number;
  completedModules: number;
  avgQuizScore: number;
  quizAttempts: number;
  srsDueCount: number;
  srsTotalCards: number;
  totalStudyMinutes: number;
  streak: number;
  recentSessions: {
    date: string;
    type: string;
    durationMinutes: number;
    score?: number;
    total?: number;
  }[];
}

export interface GlobalStats {
  totalCourses: number;
  totalModules: number;
  totalCompletedModules: number;
  totalStudyMinutes: number;
  streak: number;
  totalSrsDueCount: number;
  courseSummaries: {
    courseID: string;
    courseName: string;
    completed: number;
    total: number;
    lastStudied: string | null;
  }[];
}

export function getCourseStats(courseID: string): CourseStats {
  const courses = CourseLoader.loadCourses();
  const course = courses.find((c) => c.id === courseID);
  if (!course) throw new Error(`Course ${courseID} not found`);

  const totalModules = course.modules.length;
  const completedModules = StorageProgress.getCompletedModuleCount(courseID);
  const sessions = StorageProgress.getStudySessions(courseID, 90);
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const quizSessions = sessions.filter(
    (s) => s.type === 'quiz' && s.score != null && s.total != null,
  );
  const avgQuizScore =
    quizSessions.length > 0
      ? Math.round(
          quizSessions.reduce((sum, s) => sum + (s.score! / s.total!) * 100, 0) /
            quizSessions.length,
        )
      : 0;

  const deck = CourseLoader.loadSRSDeck(courseID);
  const allCards = SRS.getCardsForCourse(deck, courseID);
  const dueCards = SRS.getDueCardsForCourse(deck, courseID);

  return {
    courseID,
    totalModules,
    completedModules,
    avgQuizScore,
    quizAttempts: quizSessions.length,
    srsDueCount: dueCards.length,
    srsTotalCards: allCards.length,
    totalStudyMinutes,
    streak: StorageProgress.getDailyStreak(),
    recentSessions: sessions.slice(0, 20).map((s) => ({
      date: s.date,
      type: s.type,
      durationMinutes: s.durationMinutes,
      score: s.score,
      total: s.total,
    })),
  };
}

export function getGlobalStats(): GlobalStats {
  const courses = CourseLoader.loadCourses();
  const allSessions = StorageProgress.getGlobalStudySessions(90);
  const totalStudyMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  let totalCompletedModules = 0;
  let totalSrsDueCount = 0;
  const courseSummaries: GlobalStats['courseSummaries'] = [];

  for (const course of courses) {
    const completed = StorageProgress.getCompletedModuleCount(course.id);
    totalCompletedModules += completed;
    const sessions = StorageProgress.getStudySessions(course.id, 90);
    const lastStudied = sessions.length > 0 ? sessions[0].date : null;
    courseSummaries.push({
      courseID: course.id,
      courseName: course.displayName,
      completed,
      total: course.modules.length,
      lastStudied,
    });

    const deck = CourseLoader.loadSRSDeck(course.id);
    totalSrsDueCount += SRS.getDueCardsForCourse(deck, course.id).length;
  }

  return {
    totalCourses: courses.length,
    totalModules: courses.reduce((sum, c) => sum + c.modules.length, 0),
    totalCompletedModules,
    totalStudyMinutes,
    streak: StorageProgress.getDailyStreak(),
    totalSrsDueCount,
    courseSummaries,
  };
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / 86400000));
}

function datePlusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function nextIntervalDays(prev: number | null, passed: boolean): number {
  if (passed) {
    if (prev == null) return LADDER_DAYS[0];
    const idx = LADDER_DAYS.indexOf(prev);
    if (idx === -1 || idx === LADDER_DAYS.length - 1) return prev;
    return LADDER_DAYS[idx + 1];
  }
  return LADDER_DAYS[0];
}

function ensureSchedule(
  key: string,
  session: StudySession | null,
  fallbackDueFrom: string | null,
): QuizSchedule | null {
  const data = Storage.load();
  if (!data.quizSchedule) data.quizSchedule = {};
  const existing = data.quizSchedule[key];
  if (existing) return existing;

  let nextDue: string | null = null;
  if (session) {
    nextDue = datePlusDays(session.date, LADDER_DAYS[0]);
  } else if (fallbackDueFrom && daysSince(fallbackDueFrom) >= QUIZ_DUE_DAYS) {
    nextDue = datePlusDays(fallbackDueFrom.split('T')[0], QUIZ_DUE_DAYS);
  }
  if (!nextDue) return null;

  const schedule: QuizSchedule = { intervalDays: LADDER_DAYS[0], nextDue };
  data.quizSchedule[key] = schedule;
  Storage.save(data);
  return schedule;
}

function attemptStatus(
  session: StudySession | null,
  fallbackDueFrom: string | null,
  courseID: string,
  key: string,
): QuizAttemptStatus | null {
  const schedule = ensureSchedule(`${courseID}:${key}`, session, fallbackDueFrom);
  if (!schedule) return null;
  const today = todayStr();
  const overdue = schedule.nextDue < today;
  const ready = schedule.nextDue === today;
  return {
    attempted: session != null,
    score: session?.score ?? 0,
    total: session?.total ?? 0,
    date: session ? session.date : (fallbackDueFrom ?? schedule.nextDue),
    due: overdue || ready,
    overdue,
    ready,
  };
}

export function recordQuizResult(
  courseID: string,
  moduleID: string,
  score: number,
  total: number,
): void {
  const data = Storage.load();
  if (!data.quizSchedule) data.quizSchedule = {};
  const key = `${courseID}:${moduleID}`;
  const prev = data.quizSchedule[key]?.intervalDays ?? null;
  const passed = total > 0 && score / total >= PASS_RATIO;
  const interval = nextIntervalDays(prev, passed);
  const last = StorageProgress.getLastQuizSession(courseID, moduleID);
  const base = last?.date ?? datePlusDays(todayStr(), 0);
  data.quizSchedule[key] = { intervalDays: interval, nextDue: datePlusDays(base, interval) };
  Storage.save(data);
}

function cumulativeDisplayLabel(id: string): string {
  const range = id.match(/^cumulative_quiz_(\d+)-(\d+).yaml$/);
  if (range) return ` ${range[1].padStart(2, '0')}–${range[2].padStart(2, '0')}`;
  const single = id.match(/^cumulative_quiz_(\d+).yaml$/);
  if (single) return ` 01–${single[1].padStart(2, '0')}`;
  return '';
}

export function getQuizStatus(courseID: string): CourseQuizStatus {
  const courses = CourseLoader.loadCourses();
  const course = courses.find((c) => c.id === courseID);
  if (!course) throw new Error(`Course ${courseID} not found`);

  const index = CourseLoader.getQuizIndex(courseID);
  const modules: ModuleQuizStatus[] = [];
  for (const [dirName, hasQuiz] of Object.entries(index.modules)) {
    const moduleId = dirName.split('-')[0];
    const meta = course.modules.find((m) => m.id === moduleId);
    const completedAt = StorageProgress.getModuleCompletedAt(courseID, moduleId);
    modules.push({
      moduleId,
      moduleName: meta?.name || dirName.slice(moduleId.length + 1).replace(/-/g, ' ') || moduleId,
      attempt: hasQuiz
        ? attemptStatus(
            StorageProgress.getLastQuizSession(courseID, moduleId),
            completedAt,
            courseID,
            moduleId,
          )
        : null,
    });
  }

  const cumulativeQuizzes: CumulativeQuizStatus[] = index.cumulativeQuizzes.map((cq) => ({
    id: cq.id,
    milestone: cq.milestone,
    displayLabel: cumulativeDisplayLabel(cq.id),
    attempt: attemptStatus(
      StorageProgress.getLastQuizSession(courseID, cq.id),
      null,
      courseID,
      cq.id,
    ),
  }));

  return { courseID, modules, cumulativeQuizzes };
}
