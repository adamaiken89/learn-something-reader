import type { CourseQuizStatus, QuizAttemptStatus } from '../bun/stats';
import type { Course, ModuleMeta, QuizIndex } from '../bun/types';
import type { View } from './stores/viewStore';

export type QuizDriveKind = 'module' | 'cumulative';

export interface QuizTarget {
  key: string;
  kind: QuizDriveKind;
  label: string;
  module?: ModuleMeta;
  cumulativeQuizId?: string;
}

export interface QuizPresence {
  modules: Array<{ moduleId: string; hasQuiz: boolean }>;
  cumulativeQuizzes: Array<{ id: string; milestone: number }>;
}

export function presenceFromIndex(index: QuizIndex): QuizPresence {
  return {
    modules: Object.entries(index.modules).map(([dirName, hasQuiz]) => ({
      moduleId: dirName.split('-')[0],
      hasQuiz,
    })),
    cumulativeQuizzes: index.cumulativeQuizzes,
  };
}

function presenceFromStatus(status: CourseQuizStatus): QuizPresence {
  return {
    modules: status.modules.map((m) => ({
      moduleId: m.moduleId,
      hasQuiz: m.attempt !== null,
    })),
    cumulativeQuizzes: status.cumulativeQuizzes.map((cq) => ({
      id: cq.id,
      milestone: cq.milestone,
    })),
  };
}

function buildQuizOrder(course: Course, presence: QuizPresence): QuizTarget[] {
  const targets: QuizTarget[] = [];
  const moduleMap = new Map(course.modules.map((m) => [m.id, m]));

  for (const m of presence.modules) {
    const module = moduleMap.get(m.moduleId);
    if (!module || !m.hasQuiz) continue;
    targets.push({ key: `module:${m.moduleId}`, kind: 'module', label: module.name, module });
  }

  const cumulative = [...presence.cumulativeQuizzes].sort((a, b) => a.milestone - b.milestone);
  for (const cq of cumulative) {
    targets.push({
      key: `cumulative:${cq.id}`,
      kind: 'cumulative',
      label: cq.id,
      cumulativeQuizId: cq.id,
    });
  }

  return targets;
}

export function nextQuizAfter(
  course: Course,
  presence: QuizPresence,
  currentKey: string,
): QuizTarget | null {
  const order = buildQuizOrder(course, presence);
  const idx = order.findIndex((t) => t.key === currentKey);
  if (idx < 0) return null;
  return order[idx + 1] ?? null;
}

export function targetAttempt(
  status: CourseQuizStatus,
  target: QuizTarget,
): QuizAttemptStatus | null {
  if (target.kind === 'module') {
    return status.modules.find((m) => m.moduleId === target.module?.id)?.attempt ?? null;
  }
  return status.cumulativeQuizzes.find((c) => c.id === target.cumulativeQuizId)?.attempt ?? null;
}

export function dueTargets(course: Course, status: CourseQuizStatus): QuizTarget[] {
  const targets = buildQuizOrder(course, presenceFromStatus(status));
  return targets.filter((t) => targetAttempt(status, t)?.due ?? false);
}

export type QuizDueState = 'ready' | 'overdue' | 'none';

export function dueStateOf(status: CourseQuizStatus, target: QuizTarget): QuizDueState {
  const attempt = targetAttempt(status, target);
  if (attempt?.overdue) return 'overdue';
  if (attempt?.ready) return 'ready';
  return 'none';
}

export function targetToView(course: Course, target: QuizTarget): View {
  if (target.kind === 'cumulative') {
    return { type: 'cumulativeQuiz', course, cumulativeQuizId: target.cumulativeQuizId };
  }
  if (!target.module) return { type: 'dashboard' };
  return { type: 'quiz', course, module: target.module };
}
