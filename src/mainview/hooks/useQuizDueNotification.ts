import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../api';
import { dueStateOf, dueTargets } from '../quizDrive';
import { useCourseStore } from '../stores/courseStore';

export function useQuizDueNotification() {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || courses.length === 0) return;
    let cancelled = false;
    void Promise.all(courses.map((c) => api.quiz.status(c.id).catch(() => null)))
      .then((statuses) => {
        if (cancelled) return;
        let ready = 0;
        let overdue = 0;
        courses.forEach((course, i) => {
          const st = statuses[i];
          if (!st) return;
          for (const target of dueTargets(course, st)) {
            if (dueStateOf(st, target) === 'overdue') overdue++;
            else ready++;
          }
        });
        const count = ready + overdue;
        if (count === 0) return;
        firedRef.current = true;
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted') {
          new Notification('CourseReader', {
            body: t('notification.quizDue.statusSplit', { ready, overdue }),
          });
        } else if (Notification.permission === 'default') {
          void Notification.requestPermission();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courses, t]);
}
