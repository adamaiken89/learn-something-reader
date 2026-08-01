import { useEffect, useRef, useState } from 'react';

import type { Course } from '../../bun/types';
import { api } from '../api';
import { dueStateOf, dueTargets, type QuizDriveKind, targetToView } from '../quizDrive';
import { useCourseStore } from '../stores/courseStore';
import { useViewStore, type View } from '../stores/viewStore';

export interface DueQuiz {
  course: Course;
  view: View;
  kind: QuizDriveKind;
  label: string;
}

export function useQuizDueStatus() {
  const courses = useCourseStore((s) => s.courses);
  const views = useViewStore((s) => s.views);
  const [ready, setReady] = useState<DueQuiz[]>([]);
  const [overdue, setOverdue] = useState<DueQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const onDashboardRef = useRef(
    views.length === 0 || views[views.length - 1]?.type === 'dashboard',
  );

  useEffect(() => {
    const onDashboard = views.length === 0 || views[views.length - 1]?.type === 'dashboard';
    if (onDashboard && !onDashboardRef.current) setRefreshTick((t) => t + 1);
    onDashboardRef.current = onDashboard;
  }, [views]);

  useEffect(() => {
    let cancelled = false;
    if (courses.length === 0) {
      setLoading(false);
      setReady([]);
      setOverdue([]);
      return;
    }
    setLoading(true);
    void Promise.all(courses.map((c) => api.quiz.status(c.id).catch(() => null)))
      .then((statuses) => {
        if (cancelled) return;
        const readyFlat: DueQuiz[] = [];
        const overdueFlat: DueQuiz[] = [];
        courses.forEach((course, i) => {
          const st = statuses[i];
          if (!st) return;
          for (const target of dueTargets(course, st)) {
            const item: DueQuiz = {
              course,
              view: targetToView(course, target),
              kind: target.kind,
              label: target.label,
            };
            if (dueStateOf(st, target) === 'overdue') overdueFlat.push(item);
            else readyFlat.push(item);
          }
        });
        setReady(readyFlat);
        setOverdue(overdueFlat);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courses, refreshTick]);

  return { ready, overdue, due: [...ready, ...overdue], loading };
}
