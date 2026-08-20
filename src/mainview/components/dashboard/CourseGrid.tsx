import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countCompleted, useCompletionStore } from '../../stores/completionStore';
import { useCourseStore } from '../../stores/courseStore';
import CourseCard from './CourseCard';

type StatusFilter = 'all' | 'inProgress' | 'notStarted' | 'completed';

export default function CourseGrid() {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);
  const completed = useCompletionStore((s) => s.completed);
  const totalModules = useCompletionStore((s) => s.totalModules);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('inProgress');

  if (courses.length === 0) return null;

  const counts: Record<StatusFilter, number> = {
    all: 0,
    inProgress: 0,
    notStarted: 0,
    completed: 0,
  };
  const statusOf = new Map<string, StatusFilter>();
  for (const course of courses) {
    const total = totalModules[course.id] ?? course.modules.length;
    const done = countCompleted(completed, course.id);
    const status: StatusFilter =
      total > 0 && done === total ? 'completed' : done > 0 ? 'inProgress' : 'notStarted';
    statusOf.set(course.id, status);
    counts[status]++;
    counts.all++;
  }

  const q = query.trim().toLowerCase();
  const filtered = courses.filter(
    (c) =>
      (filter === 'all' || statusOf.get(c.id) === filter) &&
      (q === '' || c.displayName.toLowerCase().includes(q)),
  );

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('dashboard.tabAll') },
    { key: 'inProgress', label: t('dashboard.tabInProgress') },
    { key: 'notStarted', label: t('dashboard.tabNotStarted') },
    { key: 'completed', label: t('dashboard.tabCompleted') },
  ];
  const activeTabLabel = tabs.find((t) => t.key === filter)?.label ?? '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="relative sm:max-w-xs flex-1">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('dashboard.searchPlaceholder')}
            className="w-full bg-[#131620] border border-white/[0.06] rounded-md pl-7 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-indigo-500/40 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                {tab.label}
                <span className={active ? 'ml-1 text-indigo-300' : 'ml-1 text-gray-600'}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          {q ? t('dashboard.noMatch') : t('dashboard.noCoursesFilter', { filter: activeTabLabel })}
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
