import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Course } from '../../bun/types';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';
import { countCompleted, useCompletionStore } from '../stores/completionStore';
import { useCourseStore } from '../stores/courseStore';
import { selectableItemVariants } from './ui';

interface Props {
  currentCourseId?: string;
  onSelect: (course: Course) => void;
}

export default function CourseSwitcher({ currentCourseId, onSelect }: Props) {
  const { t } = useTranslation();
  const courses = useCourseStore((s) => s.courses);
  const completed = useCompletionStore((s) => s.completed);
  const load = useCourseStore((s) => s.load);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = courses.find((s) => s.id === currentCourseId);
  const showDropdown = useDelayedUnmount(open, 150);

  return (
    <div ref={ref} className="relative" data-course-id={currentCourseId}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[380px]"
      >
        <span className="truncate">{current?.displayName ?? t('common.modules')}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {showDropdown && (
        <div
          className={`absolute top-full left-0 mt-1 min-w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden ${open ? 'anim-dropdown-in' : 'anim-dropdown-out'}`}
        >
          {courses.length === 0 && (
            <div className="p-3 text-sm text-gray-500">{t('courseSwitcher.noCourses')}</div>
          )}
          {courses.map((s) => {
            const count = countCompleted(completed, s.id);
            const total = s.modules.length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm ${selectableItemVariants({ selected: s.id === currentCourseId })}`}
              >
                <div className="font-medium truncate">{s.displayName}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span>
                    {s.modules.length} {t('common.modules')} · {s.timeBudgetHours}h
                  </span>
                  {total > 0 && (
                    <span className="text-indigo-400">
                      {count}/{total} ({pct}%)
                    </span>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
