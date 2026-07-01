import { useTranslation } from 'react-i18next';

import { countCompleted, useCourseListPage } from '../hooks/useCourseListPage';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useViewStore } from '../stores/viewStore';

export default function CourseListPage() {
  const { t } = useTranslation();
  const { courses, completed, loading, error } = useCourseListPage();
  const push = useViewStore((s) => s.push);

  if (loading)
    return <div className="p-8 text-center text-gray-400">{t('courseList.loadingCourses')}</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-400">
        {t('courseList.loadError')}: {error}
      </div>
    );

  return (
    <PageLayout>
      <PageHeader />
      <PageContent>
        {courses.length === 0 && (
          <div className="text-center py-12 text-gray-500">{t('courseList.noCourses')}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => push({ type: 'moduleList', course })}
              className="text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl p-5 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {course.displayName}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{course.targetLevel}</span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">
                      {course.timeBudgetHours}h
                    </span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">
                      {t('courseList.modules', { count: course.modules.length })}
                    </span>
                  </div>
                  {(() => {
                    const count = countCompleted(completed, course.id);
                    const total = course.modules.length;
                    if (total === 0) return null;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{t('courseList.progress')}</span>
                          <span>
                            {count}/{total} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  {course.learningObjectives.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {course.learningObjectives.slice(0, 3).map((obj, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5 shrink-0">→</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-gray-600 group-hover:text-indigo-400 ml-4 mt-1 shrink-0">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </PageContent>
    </PageLayout>
  );
}
