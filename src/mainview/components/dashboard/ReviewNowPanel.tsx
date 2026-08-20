import { AlarmClock, Layers } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GlobalStats } from '../../../bun/stats';
import type { Course } from '../../../bun/types';
import type { DueQuiz } from '../../hooks/useQuizDueStatus';
import { useViewStore } from '../../stores/viewStore';

const ROW_LIMIT = 4;

interface CourseReinforce {
  course: Course;
  srsDue: number;
  quizReady: number;
  quizOverdue: number;
}

export default function ReviewNowPanel({
  courses,
  globalStats,
  ready,
  overdue,
  loading,
}: {
  courses: Course[];
  globalStats: GlobalStats | null;
  ready: DueQuiz[];
  overdue: DueQuiz[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const [showAll, setShowAll] = useState(false);

  const srsByCourse = new Map(
    (globalStats?.courseSummaries ?? []).map((cs) => [cs.courseID, cs.srsDueCount]),
  );

  const rows: CourseReinforce[] = courses
    .map((course) => {
      const quizReady = ready.filter((q) => q.course.id === course.id).length;
      const quizOverdue = overdue.filter((q) => q.course.id === course.id).length;
      return { course, srsDue: srsByCourse.get(course.id) ?? 0, quizReady, quizOverdue };
    })
    .filter((r) => r.srsDue > 0 || r.quizReady > 0 || r.quizOverdue > 0)
    .sort(
      (a, b) =>
        Number(b.quizOverdue > 0) - Number(a.quizOverdue > 0) ||
        Number(b.quizReady > 0) - Number(a.quizReady > 0) ||
        b.srsDue - a.srsDue,
    );

  if (loading || rows.length === 0) return null;

  const visible = showAll ? rows : rows.slice(0, ROW_LIMIT);

  return (
    <div className="bg-[#131620] border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlarmClock size={16} className="text-amber-300" />
        <h2 className="text-sm font-medium text-gray-200">{t('dashboard.reviewNowTitle')}</h2>
        <span className="text-[11px] text-gray-500">{t('dashboard.reviewNowSub')}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {visible.map((row) => (
          <button
            key={row.course.id}
            onClick={() =>
              push(
                row.quizOverdue > 0 || row.quizReady > 0
                  ? { type: 'quizHub', course: row.course }
                  : { type: 'review', course: row.course },
              )
            }
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/25 transition-colors"
          >
            <span className="text-sm text-gray-200 truncate">{row.course.displayName}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              {row.srsDue > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {t('dashboard.reviewNowSrs', { count: row.srsDue })}
                </span>
              )}
              {row.quizReady > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {t('dashboard.reviewNowQuizReady', { count: row.quizReady })}
                </span>
              )}
              {row.quizOverdue > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  {t('dashboard.reviewNowQuizOverdue', { count: row.quizOverdue })}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300">
                <Layers size={11} />
                {t('dashboard.reviewNowReview')}
              </span>
            </span>
          </button>
        ))}
        {rows.length > ROW_LIMIT && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-3 py-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            {showAll
              ? t('dashboard.reviewNowLess')
              : t('dashboard.reviewNowMore', { count: rows.length - ROW_LIMIT })}
          </button>
        )}
      </div>
    </div>
  );
}
