import { useTranslation } from 'react-i18next';

import { useDashboard } from '../hooks/useDashboard';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { useViewStore } from '../stores/viewStore';

function ResumeCard({
  lastSession,
}: {
  lastSession: NonNullable<ReturnType<typeof useDashboard>['lastSession']>;
}) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules[lastSession.course.id] ?? 0);
  const completedCount = Object.keys(completed).filter((k) =>
    k.startsWith(`${lastSession.course.id}:`),
  ).length;
  const pct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <button
      onClick={() =>
        push({
          type: 'lesson',
          course: lastSession.course,
          module: lastSession.module,
          sectionID: lastSession.sectionId,
        })
      }
      className="w-full text-left bg-gray-800 hover:bg-gray-750 border border-indigo-700 rounded-xl p-5 mb-6 transition-colors group cursor-pointer"
    >
      <p className="text-xs font-semibold text-indigo-400 mb-1">{t('dashboard.resume')}</p>
      <h2 className="text-lg font-semibold text-white">{lastSession.course.displayName}</h2>
      <p className="text-sm text-gray-400 mt-0.5">
        {t('dashboard.moduleProgress', { module: lastSession.module.name })}
      </p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{t('dashboard.progress')}</span>
          <span>
            {completedCount}/{totalModules} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function CourseGrid() {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);
  const push = useViewStore((s) => s.push);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules);

  if (courses.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        const total = totalModules[course.id] ?? course.modules.length;
        const done = Object.keys(completed).filter((k) => k.startsWith(`${course.id}:`)).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <button
            key={course.id}
            onClick={() => push({ type: 'lesson', course, module: course.modules[0] })}
            className="text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-5 transition-colors group cursor-pointer"
            title={
              course.learningObjectives.length > 0
                ? course.learningObjectives.join('\n')
                : undefined
            }
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
              {course.displayName}
            </h2>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
              <span className="bg-gray-700 px-2 py-0.5 rounded">{course.targetLevel}</span>
              <span className="bg-gray-700 px-2 py-0.5 rounded">{course.timeBudgetHours}h</span>
              <span className="bg-gray-700 px-2 py-0.5 rounded">
                {t('dashboard.modules', { count: course.modules.length })}
              </span>
            </div>
            {total > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{t('dashboard.progress')}</span>
                  <span>
                    {done}/{total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatsBar({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useDashboard>['globalStats']>;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 mb-6">
      <span>
        {t('dashboard.modulesDone')}: {stats.totalCompletedModules}/{stats.totalModules}
      </span>
      <span className="text-gray-600">|</span>
      <span>
        {t('dashboard.streak')}: {stats.streak}d
      </span>
      <span className="text-gray-600">|</span>
      <span>{t('dashboard.minutes', { count: stats.totalStudyMinutes })}</span>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg mb-2">{t('dashboard.noCourses')}</p>
      <p className="text-sm text-gray-600">
        {t('dashboard.addCoursesHint', { path: '~/.coursereader/subjects/' })}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { courses, lastSession, globalStats, loading } = useDashboard();
  const push = useViewStore((s) => s.push);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader
          title={t('dashboard.title')}
          actions={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => push({ type: 'bookmarks' })}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('common.bookmarks')}
              </button>
              <button
                onClick={() => push({ type: 'settings' })}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('common.settings')}
              </button>
            </div>
          }
        />
        <PageContent>
          <div className="text-center text-gray-500 py-12">{t('common.loading')}</div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.title')}
        actions={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => push({ type: 'bookmarks' })}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t('common.bookmarks')}
            </button>
            <button
              onClick={() => push({ type: 'settings' })}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t('common.settings')}
            </button>
          </div>
        }
      />
      <PageContent>
        {lastSession && <ResumeCard lastSession={lastSession} />}

        {globalStats && <StatsBar stats={globalStats} />}

        {courses.length === 0 ? <EmptyState /> : <CourseGrid />}
      </PageContent>
    </PageLayout>
  );
}
