import { AlarmClock, Bookmark, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../bun/types';
import CourseGrid from '../components/dashboard/CourseGrid';
import EmptyState from '../components/dashboard/EmptyState';
import ResumeCard from '../components/dashboard/ResumeCard';
import StatsBar from '../components/dashboard/StatsBar';
import SearchOverlay from '../components/SearchOverlay';
import { useDashboard } from '../hooks/useDashboard';
import { useQuizDueStatus } from '../hooks/useQuizDueStatus';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useViewStore } from '../stores/viewStore';

const DUE_ROW_LIMIT = 4;

interface CourseDueAgg {
  course: Course;
  ready: number;
  overdue: number;
}

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greetingMorning';
  if (h < 18) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { courses, lastSession, globalStats, loading } = useDashboard();
  const { ready, overdue, loading: dueLoading } = useQuizDueStatus();
  const push = useViewStore((s) => s.push);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dueShowAll, setDueShowAll] = useState(false);

  const readyCount = ready.length;
  const overdueCount = overdue.length;
  const dueCount = readyCount + overdueCount;

  const aggMap = new Map<string, CourseDueAgg>();
  for (const q of ready) {
    const agg = aggMap.get(q.course.id) ?? { course: q.course, ready: 0, overdue: 0 };
    agg.ready++;
    aggMap.set(q.course.id, agg);
  }
  for (const q of overdue) {
    const agg = aggMap.get(q.course.id) ?? { course: q.course, ready: 0, overdue: 0 };
    agg.overdue++;
    aggMap.set(q.course.id, agg);
  }
  const courseRows = [...aggMap.values()].sort(
    (a, b) =>
      b.overdue - a.overdue ||
      b.ready - a.ready ||
      a.course.displayName.localeCompare(b.course.displayName),
  );
  const visibleRows = dueShowAll ? courseRows : courseRows.slice(0, DUE_ROW_LIMIT);
  const startCourse = courseRows[0]?.course ?? null;

  const iconBtn =
    'p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 rounded-md transition-colors';

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <button onClick={() => setSearchOpen(true)} className={iconBtn} title={t('app.search')}>
        <Search size={14} />
      </button>
      <button
        onClick={() => push({ type: 'bookmarks' })}
        className={iconBtn}
        title={t('common.bookmarks')}
      >
        <Bookmark size={14} />
      </button>
      <button
        onClick={() => push({ type: 'settings' })}
        className={iconBtn}
        title={t('common.settings')}
      >
        <Settings size={14} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageLayout className="dashboard-bg">
        <PageHeader title={t('dashboard.title')} actions={headerActions} />
        <PageContent className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-700/50 rounded-lg" />
            <div className="h-16 bg-gray-700/50 rounded-lg" />
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-700/50 rounded-lg" />
              ))}
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="dashboard-bg">
      <PageHeader title={t('dashboard.title')} actions={headerActions} />
      <PageContent className="px-6 py-4">
        <div className="anim-fade-in-up">
          <p className="text-sm text-gray-400 mb-4">{t(greetingKey())}.</p>
          {lastSession && <ResumeCard lastSession={lastSession} />}
        </div>

        <div className="anim-fade-in-up" style={{ animationDelay: '80ms' }}>
          {globalStats && (
            <StatsBar
              stats={globalStats}
              onSrsDueClick={() => {
                const c = courses[0];
                if (c) push({ type: 'review', course: c });
              }}
            />
          )}
        </div>

        <div className="anim-fade-in-up" style={{ animationDelay: '160ms' }}>
          {courses.length === 0 ? <EmptyState /> : <CourseGrid />}
        </div>

        {!dueLoading && dueCount > 0 && (
          <div className="anim-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-[#131620] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlarmClock size={16} className="text-amber-300" />
                  <h2 className="text-sm font-medium text-gray-200">
                    {t('dashboard.quizDue.statusSplit', {
                      ready: readyCount,
                      overdue: overdueCount,
                    })}
                  </h2>
                </div>
                {startCourse && (
                  <button
                    onClick={() => push({ type: 'quizHub', course: startCourse })}
                    className="inline-flex items-center rounded-md bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/30 transition-colors"
                  >
                    {t('dashboard.quizDue.start')}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {visibleRows.map((row) => (
                  <button
                    key={row.course.id}
                    onClick={() => push({ type: 'quizHub', course: row.course })}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/25 transition-colors"
                  >
                    <span className="text-sm text-gray-200">{row.course.displayName}</span>
                    <span className="flex items-center gap-1.5">
                      {row.ready > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {t('dashboard.quizDue.readyBadge', { count: row.ready })}
                        </span>
                      )}
                      {row.overdue > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {t('dashboard.quizDue.overdueBadge', { count: row.overdue })}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                {courseRows.length > DUE_ROW_LIMIT && (
                  <button
                    onClick={() => setDueShowAll((v) => !v)}
                    className="px-3 py-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    {dueShowAll
                      ? t('dashboard.quizDue.less')
                      : t('dashboard.quizDue.more', { count: courseRows.length - DUE_ROW_LIMIT })}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContent>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </PageLayout>
  );
}
