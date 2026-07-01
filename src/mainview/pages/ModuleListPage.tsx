import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../bun/types';
import CourseSwitcher from '../components/CourseSwitcher';
import PageContent from '../layouts/PageContent';
import PageHeader from '../layouts/PageHeader';
import PageLayout from '../layouts/PageLayout';
import { useCompletionStore } from '../stores/completionStore';
import { useViewStore } from '../stores/viewStore';

interface Props {
  course: Course;
}

export default function ModuleListPage({ course }: Props) {
  const { t } = useTranslation();
  const push = useViewStore((s) => s.push);
  const loadModules = useCompletionStore((s) => s.loadModules);

  useEffect(() => {
    void loadModules(course.id);
  }, [course.id, loadModules]);

  const completed = useCompletionStore((s) => s.completed);

  return (
    <PageLayout>
      <PageHeader
        center={
          <CourseSwitcher
            currentCourseId={course.id}
            onSelect={(c) => push({ type: 'moduleList', course: c })}
          />
        }
      />

      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {course.modules.map((mod) => {
            const isCompleted = completed[`${course.id}:${mod.id}`] ?? false;
            return (
              <button
                key={mod.id}
                onClick={() => push({ type: 'lesson', course, module: mod })}
                className={`text-left bg-gray-800 hover:bg-gray-750 border rounded-xl p-5 transition-colors group cursor-pointer ${
                  isCompleted
                    ? 'border-emerald-700 hover:border-emerald-600'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                      isCompleted
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-indigo-900/50 text-indigo-400'
                    }`}
                  >
                    {isCompleted ? t('icons.check') : String(mod.id)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {mod.name}
                    </h2>
                    {mod.timeHours > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{mod.timeHours}h</p>
                    )}
                    {mod.topics && mod.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mod.topics.map((t, ti) => (
                          <span
                            key={ti}
                            className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 group-hover:text-indigo-400 shrink-0 mt-1">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </PageContent>
    </PageLayout>
  );
}
